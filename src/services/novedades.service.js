/**
 * @module NovedadService
 * @description Lógica de negocio para la gestión de novedades (Proceso 07.1).
 * Alineado con el modelo Novedad real: tipo_novedad, prioridad, estado, descripcion,
 * usuario_reporta_id (quien la reporta, se toma del usuario autenticado -- HU 07.1.8.3/
 * 07.1.9.1 exigen poder filtrar "solo las mías"), usuario_asignado_id, vehiculo_id,
 * celda_id (la ubicación), parqueadero_id, registro_acceso_id.
 */

const repo = require('../repositories/novedades.repository');
const vehRepo = require('../repositories/vehiculo.repository');
const celdaRepo = require('../repositories/celda.repository');
const parqRepo = require('../repositories/parqueadero.repository');
const registroAccesoRepo = require('../repositories/entradaSalida.repository');
const usuarioRepo = require('../repositories/usuario.repository');
const conductorRepo = require('../repositories/conductor.repository');
const evidenciaRepo = require('../repositories/evidenciaNovedad.repository');
const { runWithUsuario, traducirErrorTrigger } = require('../utils/dbContext.util');
const { enviarCorreoReporteDescartado, enviarSinBloquear } = require('../utils/mailer.util');
const { ROLES } = require('../config/roles');
const { LIMITE_ESTADIA_MINUTOS } = require('../config/estadia');

const TIPOS_PERMITIDOS = ['DANIO', 'ACCIDENTE', 'MAL_ESTACIONAMIENTO', 'QUEJA', 'OTRO'];
const CLASES_PERMITIDAS = ['INCIDENTE', 'NOVEDAD'];
const PRIORIDADES_PERMITIDAS = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
const ESTADOS_PERMITIDOS = ['PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'CERRADA', 'CANCELADA'];

/**
 * Transiciones válidas del ciclo de vida de una novedad. CERRADA y CANCELADA son
 * terminales: una novedad cerrada no puede reabrirse ni "inactivarse" desde el switch del
 * frontend. Antes update() aceptaba cualquier estado del enum viniera de donde viniera, así
 * que bastaba un PUT directo por HTTP para revivir un incidente ya cerrado.
 *
 * CERRADA es el desenlace "no procede" (el frontend lo llama RECHAZADO) y se puede llegar a
 * él desde cualquier estado abierto: un reporte que no corresponde se descarta cuando se
 * detecta, no hay que resolverlo antes para poder decir que no procedía.
 */
const TRANSICIONES_VALIDAS = {
  PENDIENTE: ['EN_PROCESO', 'RESUELTA', 'CERRADA', 'CANCELADA'],
  EN_PROCESO: ['RESUELTA', 'CERRADA', 'CANCELADA'],
  RESUELTA: ['CERRADA'],
  CERRADA: [],
  CANCELADA: [],
};

/** Desenlaces negativos: hay que decir por qué, porque lo lee quien reportó. */
const ESTADOS_CON_MOTIVO = ['CERRADA', 'CANCELADA'];

/**
 * Rechaza un cambio de estado que no siga el ciclo de vida.
 * @private
 * @param {string} actual
 * @param {string} nuevo
 * @throws {Object} 409 si la transición no está permitida.
 */
const _validarTransicion = (actual, nuevo) => {
  if (actual === nuevo) return;

  const permitidos = TRANSICIONES_VALIDAS[actual] || [];
  if (permitidos.includes(nuevo)) return;

  if (!permitidos.length) {
    throw {
      status: 409,
      message: `La novedad está ${actual} y ese es un estado final: no puede volver a cambiar de estado`,
    };
  }
  throw {
    status: 409,
    message: `No se puede pasar de ${actual} a ${nuevo}. Desde ${actual} solo se permite: ${permitidos.join(', ')}`,
  };
};

/**
 * Obtiene todas las novedades.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca una novedad por ID.
 * @param {number} id
 * @throws {Object} 404 si no existe.
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Novedad no encontrada' };
  const [evidencias, reportante] = await Promise.all([
    evidenciaRepo.findByNovedad(id),
    conductorRepo.findByUsuarioId(item.usuario_reporta_id),
  ]);
  return {
    ..._enriquecerContexto(item),
    evidencias,
    // Documento/nombre/correo de quien reportó -- constancia histórica pedida para
    // reportes de Comunidad SENA (usuario_reporta_id es un FK inmutable a `usuario`,
    // el documento en sí vive en su Conductor vinculado, si tiene uno).
    reportante_documento: reportante ? `${reportante.tipo_documento} ${reportante.numero_documento}` : null,
  };
};

/**
 * Obtiene novedades por vehículo.
 * @param {number} vehiculoId
 * @returns {Promise<Array>}
 */
const getByVehiculo = (vehiculoId) => repo.findByVehiculo(vehiculoId);

/**
 * Obtiene novedades asociadas a un registro de acceso (ingreso/salida).
 * @param {number} registroAccesoId
 * @returns {Promise<Array>}
 */
const getByRegistroAcceso = (registroAccesoId) => repo.findByRegistroAcceso(registroAccesoId);

/**
 * Filtra novedades por tipo, prioridad y/o estado. Valida los valores antes de tocar la
 * BD -- un valor fuera del enum antes caía crudo a Postgres (500 "invalid input value
 * for enum") en vez de un 400 legible.
 * @param {Object} filtros
 * @throws {Object} 400 si algún filtro trae un valor fuera del enum correspondiente.
 * @returns {Promise<Array>}
 */
const getByFiltros = (filtros) => {
  const { tipo_novedad, prioridad, estado } = filtros;
  if (tipo_novedad && !TIPOS_PERMITIDOS.includes(tipo_novedad)) {
    throw { status: 400, message: `Tipo de novedad inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }
  if (prioridad && !PRIORIDADES_PERMITIDAS.includes(prioridad)) {
    throw { status: 400, message: `Prioridad inválida. Permitidas: ${PRIORIDADES_PERMITIDAS.join(', ')}` };
  }
  if (estado && !ESTADOS_PERMITIDOS.includes(estado)) {
    throw { status: 400, message: `Estado inválido. Permitidos: ${ESTADOS_PERMITIDOS.join(', ')}` };
  }
  return repo.findByFiltros(filtros);
};

/**
 * Valida que las entidades relacionadas (si vienen) existan.
 * @private
 */
const _validarReferencias = async ({ vehiculo_id, celda_id, parqueadero_id, registro_acceso_id, usuario_asignado_id }) => {
  if (vehiculo_id) {
    const veh = await vehRepo.findById(vehiculo_id);
    if (!veh) throw { status: 404, message: 'Vehículo no encontrado' };
  }
  if (celda_id) {
    const celda = await celdaRepo.findById(celda_id);
    if (!celda) throw { status: 404, message: 'Celda no encontrada' };
  }
  if (parqueadero_id) {
    const parq = await parqRepo.findById(parqueadero_id);
    if (!parq) throw { status: 404, message: 'Parqueadero no encontrado' };
  }
  if (registro_acceso_id) {
    const mov = await registroAccesoRepo.findById(registro_acceso_id);
    if (!mov) throw { status: 404, message: 'Registro de acceso no encontrado' };
  }
  if (usuario_asignado_id) {
    const user = await usuarioRepo.findById(usuario_asignado_id);
    if (!user) throw { status: 404, message: 'Usuario asignado no encontrado' };
    // Administrador o Vigilante: son los dos roles que gestionan el parqueadero. Antes solo
    // se admitía Vigilante, así que un administrador no podía quedar como responsable de un
    // incidente que estaba atendiendo él mismo.
    if (user.rol_id !== ROLES.VIGILANTE && user.rol_id !== ROLES.ADMIN) {
      throw { status: 400, message: 'El encargado debe tener rol Administrador o Vigilante' };
    }
  }
};

/**
 * Deriva el "contexto" de una novedad (documento, nombre y correo del conductor, placa y
 * tipo del vehículo, hora de ingreso, tiempo de estadía) a partir de su
 * registro_acceso_id -- que es un puntero históricamente estable: vehiculo_id/
 * conductor_id de un registro_acceso quedan fijos desde el ingreso y nunca se
 * sobreescriben (ver entradaSalida.repository.js registrarSalida), así que la relación
 * sigue siendo correcta aunque después cambie la propiedad del vehículo. No se guarda
 * ningún dato duplicado: todo se deriva en lectura de tablas ya existentes.
 *
 * tiempo_estadia_minutos se calcula contra novedad.fecha_hora (el momento del reporte,
 * ya almacenado), no contra "ahora" -- así el valor de un reporte viejo no cambia cada
 * vez que se vuelve a consultar.
 * @private
 * @param {Object} novedad - Tal como lo devuelve el repositorio (incluye registroAcceso).
 * @returns {Object} La misma novedad con un campo `contexto` (null si no aplica).
 */
const _enriquecerContexto = (novedad) => {
  const registroAcceso = novedad.registroAcceso;
  if (!registroAcceso) return { ...novedad, contexto: null };

  const tiempoEstadiaMinutos = Math.max(
    0,
    Math.round((new Date(novedad.fecha_hora).getTime() - new Date(registroAcceso.fecha_hora_ingreso).getTime()) / 60000),
  );

  return {
    ...novedad,
    contexto: {
      fecha_hora_ingreso: registroAcceso.fecha_hora_ingreso,
      fecha_hora_salida: registroAcceso.fecha_hora_salida,
      es_oficial_sena: !!registroAcceso.es_oficial_sena,
      tiempo_estadia_minutos: tiempoEstadiaMinutos,
      requiere_revision_estadia: tiempoEstadiaMinutos > LIMITE_ESTADIA_MINUTOS && !registroAcceso.es_oficial_sena,
      placa: registroAcceso.vehiculo?.placa ?? null,
      tipo_vehiculo: registroAcceso.vehiculo?.tipo ?? null,
      documento: registroAcceso.conductor
        ? `${registroAcceso.conductor.tipo_documento} ${registroAcceso.conductor.numero_documento}`
        : null,
      conductor_nombre: registroAcceso.conductor?.nombre_apellidos ?? null,
      conductor_email: registroAcceso.conductor?.correo ?? null,
    },
  };
};

/**
 * Crea una nueva novedad. El reportante es siempre el usuario autenticado.
 *
 * Distingue Comunidad SENA (ROLES.CONDUCTOR) de personal autorizado (Admin/Vigilante):
 * Comunidad SENA NO puede elegir a quién se asigna ni la prioridad -- si intenta
 * enviarlos, se rechaza explícitamente (400) en vez de ignorarlos en silencio; su
 * reporte siempre nace PENDIENTE, sin asignar, con prioridad MEDIA por defecto. La
 * asignación real ocurre después, cuando personal autorizado lo acepta (ver `aceptar`).
 * El personal autorizado sigue pudiendo asignar/priorizar de una vez si quiere.
 *
 * Contexto automático desde celda_id (para no obligar a re-buscar manualmente datos ya
 * disponibles al reportar "desde una celda"): si se envía celda_id,
 *   - parqueadero_id se completa solo a partir de la celda, si no vino explícito.
 *   - vehiculo_id/registro_acceso_id se completan solos con el ingreso activo de esa
 *     celda (si hay uno), salvo que el caller ya los haya mandado explícitos.
 * @param {Object} data
 * @param {number} usuarioId - Usuario autenticado que reporta la novedad.
 * @param {number} usuarioRol - Rol del usuario autenticado (ver src/config/roles.js).
 * @throws {Object} 400 si faltan datos o son inválidos, o si Comunidad SENA intenta asignar/priorizar; 404 si alguna referencia no existe.
 * @returns {Promise<Object>}
 */
const create = async (data, usuarioId, usuarioRol) => {
  const { descripcion, celda_id, registro_acceso_id, tipo_otro } = data;
  let { vehiculo_id, parqueadero_id, usuario_asignado_id, prioridad, tipo_novedad } = data;
  const clase = data.clase || 'INCIDENTE';

  const esComunidadSena = usuarioRol === ROLES.CONDUCTOR;
  if (esComunidadSena) {
    if (usuario_asignado_id !== undefined || prioridad !== undefined) {
      throw { status: 400, message: 'Un conductor no puede seleccionar prioridad ni usuario asignado; eso lo define el personal autorizado al aceptar el reporte' };
    }
  }

  if (!CLASES_PERMITIDAS.includes(clase)) {
    throw { status: 400, message: `Clase inválida. Permitidas: ${CLASES_PERMITIDAS.join(', ')}` };
  }
  /* Una novedad es un apunte de la operación del parqueadero: la escribe quien está en ella.
     Comunidad SENA reporta incidentes —lo que le pasa a su vehículo o en la celda—, no
     observaciones de turno. */
  if (clase === 'NOVEDAD' && esComunidadSena) {
    throw { status: 403, message: 'Solo el personal del parqueadero puede registrar novedades; tu reporte se registra como incidente' };
  }

  /* Quién reporta. Por defecto quien está usando la aplicación, que es el caso normal; el
     personal autorizado puede dejarlo a nombre de otra persona (alguien que se acerca a
     reportar en portería y no tiene la aplicación abierta). Comunidad SENA solo puede
     reportar a su propio nombre. */
  let usuarioReportaId = usuarioId;
  if (data.usuario_reporta_id && Number(data.usuario_reporta_id) !== Number(usuarioId)) {
    if (esComunidadSena) {
      throw { status: 403, message: 'Solo puedes reportar a tu propio nombre' };
    }
    const reportante = await usuarioRepo.findById(data.usuario_reporta_id);
    if (!reportante) throw { status: 404, message: 'El usuario que reporta no existe' };
    usuarioReportaId = reportante.id;
  }

  /* Un incidente sin tipo no se puede clasificar ni atender; una novedad no tiene tipo que
     dar. La prioridad de un incidente la pone el personal autorizado (Comunidad SENA no
     elige, ver arriba), así que solo se le exige a quien sí puede elegirla. */
  if (clase === 'INCIDENTE') {
    if (!tipo_novedad) throw { status: 400, message: 'El tipo de incidente es requerido' };
    if (!esComunidadSena && !prioridad) {
      throw { status: 400, message: 'La prioridad es requerida para registrar un incidente' };
    }
    if (tipo_novedad === 'OTRO' && !tipo_otro?.trim()) {
      throw { status: 400, message: 'Indica de qué tipo de incidente se trata' };
    }
  } else {
    // Una novedad no arrastra tipo ni las referencias de un incidente.
    tipo_novedad = null;
    vehiculo_id = null;
  }
  // Ni la prioridad ni el asignado son obligatorios al crear: un reporte nace PENDIENTE
  // con ambos en NULL y es al ACEPTARLO cuando se vuelven obligatorios (ver aceptar()).
  usuario_asignado_id = usuario_asignado_id ?? null;
  prioridad = prioridad ?? null;

  if (!descripcion) throw { status: 400, message: 'La descripción es requerida' };
  if (tipo_novedad !== null && !TIPOS_PERMITIDOS.includes(tipo_novedad)) {
    throw { status: 400, message: `Tipo de novedad inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }
  if (prioridad !== null && !PRIORIDADES_PERMITIDAS.includes(prioridad)) {
    throw { status: 400, message: `Prioridad inválida. Permitidas: ${PRIORIDADES_PERMITIDAS.join(', ')}` };
  }

  let registroAccesoId = registro_acceso_id;
  // El contexto de una celda (parqueadero, vehículo estacionado) solo tiene sentido para un
  // incidente: una novedad no ocurre "sobre" una celda.
  if (celda_id && clase === 'INCIDENTE') {
    const celda = await celdaRepo.findById(celda_id);
    if (!celda) throw { status: 404, message: 'Celda no encontrada' };
    if (!parqueadero_id) parqueadero_id = celda.parqueadero;

    if (!registroAccesoId && !vehiculo_id) {
      const activo = await registroAccesoRepo.findActivoPorCelda(celda_id);
      if (activo) {
        registroAccesoId = activo.id;
        vehiculo_id = activo.vehiculo_id;
      }
    }
  }

  if (!parqueadero_id) throw { status: 400, message: 'El parqueadero es requerido' };

  await _validarReferencias({ vehiculo_id, celda_id, parqueadero_id, registro_acceso_id: registroAccesoId, usuario_asignado_id });

  return runWithUsuario(usuarioId, (transaction) => repo.create(
    {
      clase, tipo_novedad, tipo_otro: tipo_novedad === 'OTRO' ? tipo_otro?.trim() : null,
      prioridad, descripcion, usuario_reporta_id: usuarioReportaId, usuario_asignado_id,
      vehiculo_id, celda_id: clase === 'INCIDENTE' ? celda_id : null,
      parqueadero_id, registro_acceso_id: registroAccesoId,
    },
    { transaction },
  ));
};

/**
 * Actualiza una novedad (estado, prioridad, asignación, cierre, etc.).
 * @param {number} id
 * @param {Object} data - Campos a actualizar.
 * @param {number} usuarioId - Usuario autenticado que hace la operación.
 * @throws {Object} 404 si no existe o alguna referencia no existe; 400 si algún valor no es válido.
 * @returns {Promise<Object>}
 */
const update = async (id, data, usuarioId) => {
  const actual = await getById(id);

  if (data.tipo_novedad && !TIPOS_PERMITIDOS.includes(data.tipo_novedad)) {
    throw { status: 400, message: `Tipo de novedad inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }
  if (data.prioridad && !PRIORIDADES_PERMITIDAS.includes(data.prioridad)) {
    throw { status: 400, message: `Prioridad inválida. Permitidas: ${PRIORIDADES_PERMITIDAS.join(', ')}` };
  }
  if (data.estado && !ESTADOS_PERMITIDOS.includes(data.estado)) {
    throw { status: 400, message: `Estado inválido. Permitidos: ${ESTADOS_PERMITIDOS.join(', ')}` };
  }
  // El switch de activar/inactivar del frontend llega aquí como un PUT con `estado`; no
  // basta con que el frontend lo deshabilite.
  if (data.estado) _validarTransicion(actual.estado, data.estado);

  /* Tener un encargado es lo deseable —deja claro a quién preguntarle— pero no se exige:
     bloquear el avance por eso paraba el trabajo real por un dato administrativo. La
     aplicación lo sugiere al cambiar de estado; la decisión es de quien gestiona.

     Lo que sí es obligatorio es explicar un desenlace negativo: ese texto es lo que ve quien
     reportó cuando entra a mirar qué pasó con su reporte. Sin él, desaparecía sin
     explicación. */
  if (ESTADOS_CON_MOTIVO.includes(data.estado)) {
    const motivo = data.justificacion_cierre ?? actual.justificacion_cierre;
    if (!motivo?.trim()) {
      throw { status: 400, message: 'El motivo es obligatorio para rechazar o cancelar un incidente' };
    }
    if (!data.fecha_hora_cierre) data.fecha_hora_cierre = new Date();
  }

  await _validarReferencias(data);

  const actualizada = await runWithUsuario(usuarioId, (transaction) => repo.update(id, data, { transaction }));

  /* Quien reportó algo tiene derecho a saber que se descartó y por qué: el motivo se guarda
     precisamente para que lo lea, y hasta ahora solo lo veía si volvía a entrar a mirar.
     No bloquea: el cambio de estado ya está guardado. */
  if (ESTADOS_CON_MOTIVO.includes(data.estado)) {
    const reportante = actual.usuario_reporta_id
      ? await usuarioRepo.findById(actual.usuario_reporta_id)
      : null;
    if (reportante?.correo) {
      await enviarSinBloquear(
        enviarCorreoReporteDescartado(reportante.correo, reportante.nombre, {
          descripcion: actual.descripcion,
          desenlace: data.estado,
          motivo: data.justificacion_cierre ?? actual.justificacion_cierre,
        }),
        `novedad ${id} ${data.estado}`,
      );
    }
  }

  return actualizada;
};

/**
 * Acepta un reporte pendiente: personal autorizado asigna vigilante y prioridad, y el
 * reporte pasa a EN_PROCESO. Reutiliza `_validarReferencias` (ya exige que el asignado
 * tenga rol Vigilante) y la validación de prioridad ya existente.
 * @param {number} id
 * @param {Object} datos - { usuario_asignado_id, prioridad } (ambos obligatorios).
 * @param {number} usuarioId - Usuario autenticado (Admin/Vigilante) que acepta.
 * @throws {Object} 400 si falta usuario_asignado_id/prioridad o son inválidos; 404 si no existe.
 * @returns {Promise<Object>}
 */
const aceptar = async (id, { usuario_asignado_id, prioridad }, usuarioId) => {
  const actual = await getById(id);
  _validarTransicion(actual.estado, 'EN_PROCESO');

  if (!usuario_asignado_id) throw { status: 400, message: 'El vigilante asignado es requerido para aceptar el reporte' };
  if (!prioridad) throw { status: 400, message: 'La prioridad es requerida para aceptar el reporte' };
  if (!PRIORIDADES_PERMITIDAS.includes(prioridad)) {
    throw { status: 400, message: `Prioridad inválida. Permitidas: ${PRIORIDADES_PERMITIDAS.join(', ')}` };
  }
  await _validarReferencias({ usuario_asignado_id });

  const data = { usuario_asignado_id, prioridad, estado: 'EN_PROCESO' };
  return runWithUsuario(usuarioId, (transaction) => repo.update(id, data, { transaction }));
};

/**
 * Rechaza un reporte pendiente. No se elimina físicamente -- queda como CANCELADA (se
 * reutiliza este estado del ENUM existente en vez de agregar uno nuevo) con el motivo en
 * `justificacion_cierre`, conservando reportante, fecha/hora, descripción y evidencias.
 * @param {number} id
 * @param {Object} datos - { motivo } (obligatorio).
 * @param {number} usuarioId - Usuario autenticado (Admin/Vigilante) que rechaza.
 * @throws {Object} 400 si falta el motivo; 404 si no existe.
 * @returns {Promise<Object>}
 */
const rechazar = async (id, { motivo }, usuarioId) => {
  const actual = await getById(id);
  _validarTransicion(actual.estado, 'CANCELADA');
  if (!motivo?.trim()) throw { status: 400, message: 'El motivo de rechazo es requerido' };

  const data = { estado: 'CANCELADA', justificacion_cierre: motivo, fecha_hora_cierre: new Date() };
  return runWithUsuario(usuarioId, (transaction) => repo.update(id, data, { transaction }));
};

/**
 * Elimina una novedad.
 * @param {number} id
 * @throws {Object} 404 si no existe; 409 si tiene evidencias adjuntas.
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  await getById(id);
  try {
    return await repo.remove(id);
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

module.exports = {
  getAll,
  getById,
  getByVehiculo,
  getByRegistroAcceso,
  getByFiltros,
  create,
  update,
  aceptar,
  rechazar,
  remove,
};
