/**
 * @module ReservaService
 * @description Gestión de reservas de celdas (Proceso 06.1). Alineado con el modelo
 * Reserva real: celda_id, usuario_registra_id (vigilante que la crea), conductor_id
 * (para quién es), vehiculo_id, fecha_hora_inicio/fin, estado, usuario_gestiona_id
 * (quién la acepta/rechaza).
 *
 * La BD valida solapamientos (fn_validar_conflicto_reserva) y celdas preferenciales
 * (fn_validar_reserva_preferencial), y mueve celda.estado sola vía fn_reserva_bloquea_celda
 * cuando la reserva pasa a ACEPTADA o sale de ese estado -- por eso create/cambiarEstado/
 * remove van envueltos en runWithUsuario, y los RAISE EXCEPTION de esos triggers se
 * traducen a 409 con traducirErrorTrigger.
 */

const repo = require('../repositories/reserva.repository');
const celdaRepo = require('../repositories/celda.repository');
const vehRepo = require('../repositories/vehiculo.repository');
const conductorRepo = require('../repositories/conductor.repository');
const parqRepo = require('../repositories/parqueadero.repository');
const { runWithUsuario, traducirErrorTrigger } = require('../utils/dbContext.util');
const { HORA_APERTURA, HORA_CIERRE, horaEnBogotaTexto, esDomingoEnBogota } = require('../config/horarioOperacion');
const {
  ANTICIPACION_MINIMA_MINUTOS, DURACION_MINIMA_MINUTOS, HORA_MAXIMA_INICIO,
  MARGEN_CANCELACION_MINUTOS, MARGEN_CONFIRMACION_MINUTOS,
  MARGEN_LLEGADA_MINUTOS, MOTIVO_VENCIMIENTO_ACEPTADA, MOTIVO_SIN_CONFIRMAR, MOTIVO_FRANJA_TOMADA,
  MINUTO_MS, _enPalabras,
} = require('../config/reglasReserva');

const APERTURA = `${String(HORA_APERTURA).padStart(2, '0')}:00`;
const CIERRE = `${String(HORA_CIERRE).padStart(2, '0')}:00`;
const { ROLES } = require('../config/roles');
const { validarCompatibilidadCelda } = require('../utils/compatibilidadVehiculo.util');

const ESTADOS_GESTIONABLES = ['ACEPTADA', 'RECHAZADA', 'TERMINADA', 'CANCELADA'];

/**
 * A qué estado puede pasar una reserva según el que ya tiene. RECHAZADA, TERMINADA y
 * CANCELADA son finales: son el registro de lo que pasó.
 *
 * Sin esta tabla, cualquier reserva podía volver a ACEPTADA desde cualquier estado -- y al
 * hacerlo volvía a bloquear la celda (fn_reserva_bloquea_celda), así que una reserva
 * cancelada hace tres semanas podía dejar una celda retenida sin que nadie la esperara.
 */
const TRANSICIONES = {
  PENDIENTE: ['ACEPTADA', 'RECHAZADA', 'CANCELADA'],
  ACEPTADA: ['TERMINADA', 'CANCELADA'],
  RECHAZADA: [],
  TERMINADA: [],
  CANCELADA: [],
};

/** Estados en los que una reserva todavía se puede editar (los demás son historial). */
const ESTADOS_EDITABLES = ['PENDIENTE', 'ACEPTADA'];

/**
 * Cancela las reservas que se quedaron sin sentido, y con ellas suelta las celdas que
 * estaban reteniendo:
 *
 * - **Aceptadas** a las que ya se les pasó el margen de llegada: la celda estaba apartada
 *   para un vehículo que no llegó, y mientras siga apartada nadie más puede usarla. Se
 *   CANCELAN.
 * - **Pendientes** que llegaron al margen de confirmación sin que nadie las aprobara: a
 *   media hora del inicio ya no da tiempo de organizarse. Se RECHAZAN.
 *
 * Cada cancelación pasa por `cambiarEstado`, así que la BD libera la celda con su propio
 * trigger y queda el rastro en el historial, con el motivo escrito para que se entienda por
 * qué cambió sola. Se atribuye al usuario indicado (por defecto la cuenta administradora):
 * el historial exige un autor, y el motivo deja claro que fue automático.
 *
 * @param {number} [usuarioId=1] - A quién se le atribuye la cancelación automática.
 * @returns {Promise<number>} Cuántas reservas se cancelaron.
 */
const vencerCaducadas = async (usuarioId = 1) => {
  const ahora = new Date();
  const limiteLlegada = new Date(ahora.getTime() - MARGEN_LLEGADA_MINUTOS * MINUTO_MS);
  const limiteConfirmacion = new Date(ahora.getTime() + MARGEN_CONFIRMACION_MINUTOS * MINUTO_MS);

  const caducadas = await repo.findCaducadas(limiteConfirmacion, limiteLlegada);
  for (const reserva of caducadas) {
    // La aceptada que nadie usó se CANCELA; la solicitud que nadie aprobó a tiempo se
    // RECHAZA: no es lo mismo echarse atrás que no llegar a aprobarse.
    const esPendiente = reserva.estado === 'PENDIENTE';
    const nuevoEstado = esPendiente ? 'RECHAZADA' : 'CANCELADA';
    const motivo = esPendiente ? MOTIVO_SIN_CONFIRMAR : MOTIVO_VENCIMIENTO_ACEPTADA;
    try {
      await cambiarEstado(reserva.id, nuevoEstado, usuarioId, motivo);
    } catch (error) {
      // Que una reserva no se pueda vencer (p. ej. alguien la gestionó en este mismo
      // instante) no debe tumbar la consulta que disparó el barrido.
      console.error(`No se pudo vencer la reserva ${reserva.id}:`, error.message || error);
    }
  }
  return caducadas.length;
};

/**
 * Obtiene el listado de todas las reservas.
 *
 * Antes de responder vence las que ya caducaron: sin esto, la única forma de que una reserva
 * abandonada soltara su celda era que un administrador tuviera la aplicación abierta (el
 * vencimiento vivía solo en el navegador), así que un fin de semana sin nadie dentro dejaba
 * celdas retenidas por reservas que nadie iba a usar.
 * @param {number} [usuarioId] - Quien consulta; solo se usa para atribuir el vencimiento.
 * @returns {Promise<Array>}
 */
const getAll = async (usuarioId) => {
  await vencerCaducadas(usuarioId);
  return repo.findAll();
};

/**
 * Busca una reserva por su ID.
 * @param {number} id
 * @throws {Object} 404 si la reserva no existe.
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Reserva no encontrada' };
  return item;
};

/**
 * Filtra reservas por vehículo.
 * @param {number} vehiculoId
 * @returns {Promise<Array>}
 */
const getByVehiculo = (vehiculoId) => repo.findByVehiculo(vehiculoId);

/**
 * Filtra reservas por celda.
 * @param {number} celdaId
 * @returns {Promise<Array>}
 */
const getByCelda = (celdaId) => repo.findByCelda(celdaId);

/**
 * Valida la coherencia de las fechas de reserva.
 * @private
 */
const _validarFechas = (inicio, fin) => {
  const i = new Date(inicio);
  const f = new Date(fin);
  if (isNaN(i) || isNaN(f)) throw { status: 400, message: 'Fechas inválidas' };
  if (i >= f) throw { status: 400, message: 'fecha_hora_inicio debe ser anterior a fecha_hora_fin' };
  if (i < new Date()) throw { status: 400, message: 'No se puede reservar en una fecha/hora pasada' };

  // Ver config/reglasReserva.js: con qué antelación se pide y cuánto dura como mínimo.
  const faltan = (i.getTime() - Date.now()) / MINUTO_MS;
  if (faltan < ANTICIPACION_MINIMA_MINUTOS) {
    throw {
      status: 400,
      message: `La reserva debe pedirse con al menos ${_enPalabras(ANTICIPACION_MINIMA_MINUTOS)} de anticipación: para reservar a esa hora tendrías que hacerlo antes`,
    };
  }

  const dura = (f.getTime() - i.getTime()) / MINUTO_MS;
  if (dura < DURACION_MINIMA_MINUTOS) {
    throw {
      status: 400,
      message: `La reserva debe durar al menos ${_enPalabras(DURACION_MINIMA_MINUTOS)}`,
    };
  }

  // La reserva vive dentro del horario en que el parqueadero opera. Esto mira las horas DE
  // LA RESERVA, no la hora a la que se está pidiendo: se puede reservar de madrugada para
  // el día siguiente, lo que no se puede es reservar para una hora en la que está cerrado.
  const horaInicio = horaEnBogotaTexto(i);
  const horaFin = horaEnBogotaTexto(f);
  if (horaInicio < APERTURA || horaFin > CIERRE) {
    throw {
      status: 400,
      message: `La reserva debe estar dentro del horario de operación (${APERTURA} a ${CIERRE})`,
    };
  }
  // El parqueadero no abre los domingos, así que tampoco hay nada que reservar ese día.
  if (esDomingoEnBogota(i) || esDomingoEnBogota(f)) {
    throw { status: 400, message: 'El parqueadero no opera los domingos: elige otro día' };
  }

  // Empezar pegado al cierre no tiene coherencia; terminar cerca del cierre sí.
  if (horaInicio > HORA_MAXIMA_INICIO) {
    throw {
      status: 400,
      message: `Una reserva no puede empezar después de las ${HORA_MAXIMA_INICIO}: está muy cerca de la hora de cierre (${CIERRE})`,
    };
  }
};

/**
 * Valida que la celda y (si viene) el vehículo existan, que la celda esté en servicio,
 * que el vehículo tenga conductor y que ambos tipos sean compatibles. Devuelve las dos
 * entidades ya cargadas para que el llamador pueda reutilizarlas (p. ej. para resolver el
 * parqueadero de la celda) sin repetir la consulta.
 *
 * La compatibilidad tipo vehículo ↔ tipo celda la aplicaba solo el trigger
 * fn_validar_ocupacion_celda, que corre al INGRESAR: una reserva incompatible se creaba
 * sin problema y el conflicto aparecía días después, al llegar el vehículo. Aquí se
 * rechaza al reservar, con el mismo criterio (compatibilidadVehiculo.util.js).
 *
 * @private
 * @returns {Promise<{celda: Object|null, vehiculo: Object|null}>}
 */
const _validarEntidades = async (celdaId, vehiculoId) => {
  let celda = null;
  let vehiculo = null;

  if (celdaId !== undefined) {
    celda = await celdaRepo.findById(celdaId);
    if (!celda) throw { status: 404, message: 'Celda no encontrada' };
    // No se filtra por OCUPADA/RESERVADA: una celda ocupada hoy puede reservarse para
    // mañana, y el solapamiento real lo detecta findConflictos por rango horario. Lo que
    // nunca sirve es una celda fuera de servicio.
    if (['MANTENIMIENTO', 'INACTIVA'].includes(celda.estado)) {
      throw { status: 409, message: `La celda ${celda.numero} está en ${celda.estado.toLowerCase()} y no admite reservas` };
    }
  }

  if (vehiculoId) {
    vehiculo = await vehRepo.findById(vehiculoId);
    if (!vehiculo) throw { status: 404, message: 'Vehículo no encontrado' };
    // Sin propietario no hay a quién responsabilizar del vehículo ni a quién avisar; el
    // ingreso ya lo exigía indirectamente (el conductor debe ser propietario), la reserva no.
    if (!vehiculo.conductor_principal_id) {
      throw { status: 409, message: 'El vehículo no tiene conductor asociado: asigna un propietario antes de reservar' };
    }
  }

  if (celda && vehiculo) validarCompatibilidadCelda(vehiculo, celda);

  return { celda, vehiculo };
};

/**
 * Si quien crea la reserva es un Conductor (no Admin/Vigilante), verifica que el
 * conductor_id/vehiculo_id indicados sean los suyos -- de lo contrario, cualquier
 * usuario autenticado podría reservar en nombre de otra persona o con el vehículo
 * de otra persona. Admin/Vigilante sí pueden registrar reservas para terceros
 * (es su función: atienden a conductores en el mostrador).
 * @private
 * @param {number} usuarioRol
 * @param {number} usuarioId
 * @param {number} [conductorId]
 * @param {number} [vehiculoId]
 * @throws {Object} 403 si el conductor/vehículo no le pertenecen al usuario autenticado.
 */
const _validarPropiedad = async (usuarioRol, usuarioId, conductorId, vehiculoId) => {
  if (usuarioRol === ROLES.ADMIN || usuarioRol === ROLES.VIGILANTE) return;

  const propioConductor = await conductorRepo.findByUsuarioId(usuarioId);
  if (!propioConductor) {
    throw { status: 403, message: 'Tu cuenta no tiene un perfil de conductor asociado' };
  }
  if (conductorId !== undefined && conductorId !== null && conductorId !== propioConductor.id) {
    throw { status: 403, message: 'No puedes crear una reserva a nombre de otro conductor' };
  }
  if (vehiculoId) {
    const esPropio = await vehRepo.findPropietario(vehiculoId, propioConductor.id);
    if (!esPropio) {
      throw { status: 403, message: 'El vehículo indicado no te pertenece' };
    }
  }
};

/**
 * Crea una reserva verificando disponibilidad horaria (la BD hace una segunda
 * validación de solapamiento y de celdas preferenciales).
 * @param {Object} data - { tipo_reserva, celda_id, conductor_id?, vehiculo_id?, motivo?, fecha_hora_inicio, fecha_hora_fin }
 * @param {number} usuarioId - Usuario autenticado que registra la reserva.
 * @param {number} usuarioRol - Rol del usuario autenticado (ver src/config/roles.js).
 * @throws {Object} 400 datos faltantes/fechas inválidas, 403 si intenta reservar para otro sin ser Admin/Vigilante, 404 entidades no encontradas, 409 conflicto de horario o regla de negocio.
 * @returns {Promise<Object>}
 */
const create = async ({ tipo_reserva, celda_id, conductor_id, vehiculo_id, motivo, fecha_hora_inicio, fecha_hora_fin }, usuarioId, usuarioRol) => {
  if (!tipo_reserva || !celda_id || !fecha_hora_inicio || !fecha_hora_fin) {
    throw { status: 400, message: 'tipo_reserva, celda_id, fecha_hora_inicio y fecha_hora_fin son requeridos' };
  }
  // El motivo es lo que permite a quien aprueba decidir con criterio, y lo que explica la
  // reserva cuando alguien la revisa semanas después.
  if (!motivo || !String(motivo).trim()) {
    throw { status: 400, message: 'El motivo de la reserva es obligatorio' };
  }

  // A propósito NO se mira NADA del momento en que se pide: reservar es planear, y planear
  // se hace a cualquier hora y cualquier día — también un domingo, que es justo cuando a
  // alguien le da por organizar su semana. Lo que tiene que caber en los días y horas de
  // operación es la reserva misma, y de eso se encarga _validarFechas.
  _validarFechas(fecha_hora_inicio, fecha_hora_fin);
  const { celda } = await _validarEntidades(celda_id, vehiculo_id);
  const parq = await parqRepo.findById(celda.parqueadero);
  if (parq && !parq.estado) {
    throw { status: 409, message: 'El parqueadero se encuentra inactivo y no permite operaciones de estacionamiento.' };
  }
  await _validarPropiedad(usuarioRol, usuarioId, conductor_id, vehiculo_id);

  const conflictos = await repo.findConflictos(celda_id, fecha_hora_inicio, fecha_hora_fin);
  if (conflictos.length) {
    throw { status: 409, message: 'La celda ya tiene una reserva en ese horario' };
  }

  // Estado inicial: la celda solo pasa a RESERVADA cuando la reserva está ACEPTADA
  // (trigger fn_reserva_bloquea_celda), y chk_reserva_gestion exige usuario_gestiona_id
  // para cualquier estado distinto de PENDIENTE. Como Admin/Vigilante son precisamente
  // quienes aprueban, una reserva que ELLOS registran nace ya aceptada y bloquea la celda
  // en el acto; la que registra un Conductor para sí mismo sigue naciendo PENDIENTE y
  // espera aprobación, que es el flujo de autoservicio que ya existía.
  const gestionaAlCrear = usuarioRol === ROLES.ADMIN || usuarioRol === ROLES.VIGILANTE;
  const estadoInicial = gestionaAlCrear
    ? { estado: 'ACEPTADA', usuario_gestiona_id: usuarioId }
    : {};

  try {
    return await runWithUsuario(usuarioId, (transaction) => repo.create(
      {
        tipo_reserva, celda_id, usuario_registra_id: usuarioId, conductor_id, vehiculo_id,
        motivo, fecha_hora_inicio, fecha_hora_fin, ...estadoInicial,
      },
      { transaction },
    ));
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

/**
 * Actualiza los datos de una reserva PENDIENTE (no su estado; usar cambiarEstado).
 * @param {number} id
 * @param {Object} datos - Campos a actualizar (todos opcionales).
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 404 si no existe, 400 si fechas inválidas, 409 si conflicto.
 * @returns {Promise<Object>}
 */
const update = async (id, datos, usuarioId) => {
  const reservaActual = await getById(id);
  if (!ESTADOS_EDITABLES.includes(reservaActual.estado)) {
    throw {
      status: 409,
      message: `Una reserva ${reservaActual.estado.toLowerCase()} ya no se puede editar: forma parte del histórico`,
    };
  }

  if (datos.celda_id !== undefined || datos.vehiculo_id !== undefined) {
    await _validarEntidades(
      datos.celda_id !== undefined ? datos.celda_id : reservaActual.celda_id,
      datos.vehiculo_id !== undefined ? datos.vehiculo_id : reservaActual.vehiculo_id,
    );
  }

  const inicio = datos.fecha_hora_inicio !== undefined ? datos.fecha_hora_inicio : reservaActual.fecha_hora_inicio;
  const fin = datos.fecha_hora_fin !== undefined ? datos.fecha_hora_fin : reservaActual.fecha_hora_fin;
  if (datos.fecha_hora_inicio !== undefined || datos.fecha_hora_fin !== undefined) {
    _validarFechas(inicio, fin);
  }

  const celdaFinal = datos.celda_id !== undefined ? datos.celda_id : reservaActual.celda_id;
  const conflictos = await repo.findConflictos(celdaFinal, inicio, fin, id);
  if (conflictos.length) {
    throw { status: 409, message: 'La celda ya tiene una reserva en ese horario' };
  }

  // Mover una reserva ACEPTADA a otra celda ya no exige retener la nueva: una reserva aparta
  // una franja de la agenda, no la celda entera. Lo único que queda por hacer es soltar la
  // celda que abandona SI había quedado marcada por el modelo anterior — si no, se quedaría
  // en RESERVADA para siempre, sin ninguna reserva que lo explicara.
  const cambiaDeCelda = datos.celda_id !== undefined
    && Number(datos.celda_id) !== Number(reservaActual.celda_id);
  const mueveUnaAceptada = reservaActual.estado === 'ACEPTADA' && cambiaDeCelda;

  try {
    return await runWithUsuario(usuarioId, async (transaction) => {
      const actualizada = await repo.update(id, datos, { transaction });

      if (mueveUnaAceptada) {
        // Solo se suelta si no queda ninguna otra reserva aceptada esperándola.
        const otraQueBloquea = await repo.findReservaQueBloquea(reservaActual.celda_id, new Date(), { transaction });
        if (!otraQueBloquea) {
          await celdaRepo.liberarSiEstaReservada(reservaActual.celda_id, { transaction });
        }
      }

      return actualizada;
    });
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

/**
 * Acepta, rechaza, cancela o termina una reserva. La BD bloquea/libera la celda sola
 * (fn_reserva_bloquea_celda). Toda transición que salga de PENDIENTE debe decir quién la gestionó.
 * @param {number} id
 * @param {string} estado - ACEPTADA, RECHAZADA, TERMINADA o CANCELADA.
 * @param {number} usuarioId - Quien gestiona la reserva (auditoría + usuario_gestiona_id).
 * @throws {Object} 404 si no existe, 400 si el estado no es válido.
 * @returns {Promise<Object>}
 */
const cambiarEstado = async (id, estado, usuarioId, motivoRechazo) => {
  const reserva = await getById(id);
  if (!ESTADOS_GESTIONABLES.includes(estado)) {
    throw { status: 400, message: `Estado inválido. Permitidos: ${ESTADOS_GESTIONABLES.join(', ')}` };
  }

  // Aceptar es lo que compromete la franja: se comprueba aquí, con un mensaje que se
  // entiende, antes de que lo haga el trigger con su excepción de Postgres.
  if (estado === 'ACEPTADA') {
    const yaTomada = await repo.findConflictos(
      reserva.celda_id, reserva.fecha_hora_inicio, reserva.fecha_hora_fin, reserva.id,
    );
    if (yaTomada.length) {
      throw { status: 409, message: 'Esa celda ya tiene otra reserva aceptada en esa franja horaria' };
    }
  }

  const permitidos = TRANSICIONES[reserva.estado] ?? [];
  if (!permitidos.includes(estado)) {
    throw {
      status: 409,
      message: permitidos.length
        ? `Una reserva ${reserva.estado.toLowerCase()} solo puede pasar a: ${permitidos.join(', ')}`
        : `La reserva ya está ${reserva.estado.toLowerCase()} y no admite más cambios de estado`,
    };
  }
  // Rechazar y cancelar cambian los planes de alguien: tiene que quedar escrito por qué.
  if ((estado === 'RECHAZADA' || estado === 'CANCELADA') && !motivoRechazo?.trim()) {
    throw {
      status: 400,
      message: `El motivo es obligatorio para ${estado === 'RECHAZADA' ? 'rechazar' : 'cancelar'} una reserva`,
    };
  }

  try {
    // Se pasa el motivo de rechazo como `app.motivo` para que fn_historial_reserva lo
    // registre en historial_reserva.motivo (antes se perdía: quedaba solo en
    // reserva.motivo_rechazo y nunca llegaba al historial).
    const actualizada = await runWithUsuario(
      usuarioId,
      (transaction) => repo.cambiarEstado(id, estado, usuarioId, motivoRechazo, { transaction }),
      { motivo: motivoRechazo },
    );

    // Aceptar una reserva resuelve la competencia por esa franja: las demás solicitudes que
    // se solapaban con ella ya no pueden cumplirse, así que se cancelan solas con el motivo
    // escrito, en vez de quedarse pendientes esperando algo que nunca va a poder pasar.
    if (estado === 'ACEPTADA') await _cancelarCompetidoras(reserva, usuarioId);

    return actualizada;
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

/**
 * Cancela las solicitudes pendientes que competían por la misma celda y franja que la
 * reserva recién aceptada.
 * @private
 * @param {Object} reserva - La que se acaba de aceptar.
 * @param {number} usuarioId - Quien la aceptó (queda como gestor de las cancelaciones).
 * @returns {Promise<void>}
 */
const _cancelarCompetidoras = async (reserva, usuarioId) => {
  const competidoras = await repo.findPendientesQueChocan(
    reserva.celda_id, reserva.fecha_hora_inicio, reserva.fecha_hora_fin, reserva.id,
  );
  for (const otra of competidoras) {
    try {
      await runWithUsuario(
        usuarioId,
        (transaction) => repo.cambiarEstado(otra.id, 'CANCELADA', usuarioId, MOTIVO_FRANJA_TOMADA, { transaction }),
        { motivo: MOTIVO_FRANJA_TOMADA },
      );
    } catch (error) {
      // Que una competidora no se pueda cancelar (alguien la gestionó en este mismo
      // instante) no debe deshacer la aceptación que sí funcionó.
      console.error(`No se pudo cancelar la reserva ${otra.id} al aceptar la ${reserva.id}:`, error.message || error);
    }
  }
};

/**
 * Cancela una reserva propia.
 *
 * Existe aparte de `cambiarEstado` porque esa ruta es de quien gestiona el parqueadero
 * (Admin/Vigilante): un Conductor no puede aceptar ni rechazar nada, pero sí tiene que poder
 * echarse atrás de lo que él mismo pidió. Sin esto, una solicitud suya solo la podía retirar
 * un administrador, y la celda se quedaba retenida hasta que alguien se acordara.
 *
 * @param {number} id
 * @param {number} usuarioId - Quien cancela.
 * @param {number} usuarioRol - Su rol (ver src/config/roles.js).
 * @param {string} motivo - Por qué se cancela. Obligatorio, como en cualquier cancelación.
 * @throws {Object} 400 sin motivo, 403 si la reserva no es suya, 404 si no existe, 409 si ya no se puede cancelar.
 * @returns {Promise<Object>}
 */
const cancelar = async (id, usuarioId, usuarioRol, motivo) => {
  const reserva = await getById(id);

  if (usuarioRol !== ROLES.ADMIN && usuarioRol !== ROLES.VIGILANTE) {
    const propioConductor = await conductorRepo.findByUsuarioId(usuarioId);
    // Vale tanto si la reserva está a su nombre como si fue él quien la registró: son las
    // dos formas en que una reserva puede ser "suya".
    const esSuya = (propioConductor && Number(reserva.conductor_id) === Number(propioConductor.id))
      || Number(reserva.usuario_registra_id) === Number(usuarioId);
    if (!esSuya) {
      throw { status: 403, message: 'Solo puedes cancelar tus propias reservas' };
    }

    // Cancelar sobre la hora deja la celda vacía sin tiempo de que otra persona la
    // aproveche (ver config/reglasReserva.js). Quien gestiona el parqueadero sí puede
    // hacerlo a cualquier hora: para eso atiende el mostrador.
    const faltan = (new Date(reserva.fecha_hora_inicio).getTime() - Date.now()) / MINUTO_MS;
    if (faltan < MARGEN_CANCELACION_MINUTOS) {
      throw {
        status: 409,
        message: `Solo puedes cancelar hasta ${_enPalabras(MARGEN_CANCELACION_MINUTOS)} antes de la hora de inicio. Acércate al parqueadero para que te ayuden.`,
      };
    }
  }

  return cambiarEstado(id, 'CANCELADA', usuarioId, motivo);
};

/**
 * Elimina una reserva. Solo se permite mientras sigue PENDIENTE (nunca gestionada);
 * una reserva ya aceptada/rechazada/cancelada/terminada es histórico y no debe poder
 * borrarse físicamente.
 * @param {number} id
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 404 si no existe, 409 si ya fue gestionada o no se puede eliminar (integridad referencial).
 * @returns {Promise<boolean>}
 */
const remove = async (id, usuarioId) => {
  const reserva = await getById(id);
  if (reserva.estado !== 'PENDIENTE') {
    throw { status: 409, message: 'Solo se pueden eliminar reservas en estado PENDIENTE; las reservas ya gestionadas forman parte del histórico' };
  }
  try {
    return await runWithUsuario(usuarioId, (transaction) => repo.remove(id, { transaction }));
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

module.exports = {
  getAll,
  getById,
  getByVehiculo,
  getByCelda,
  create,
  update,
  cambiarEstado,
  cancelar,
  vencerCaducadas,
  remove,
};
