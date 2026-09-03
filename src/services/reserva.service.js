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
const { validarHorarioOperacion } = require('../config/horarioOperacion');
const { ROLES } = require('../config/roles');
const { validarCompatibilidadCelda } = require('../utils/compatibilidadVehiculo.util');

const ESTADOS_GESTIONABLES = ['ACEPTADA', 'RECHAZADA', 'TERMINADA', 'CANCELADA'];

/**
 * Obtiene el listado de todas las reservas.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

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

  validarHorarioOperacion();
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

  try {
    return await runWithUsuario(usuarioId, (transaction) => repo.update(id, datos, { transaction }));
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
  await getById(id);
  if (!ESTADOS_GESTIONABLES.includes(estado)) {
    throw { status: 400, message: `Estado inválido. Permitidos: ${ESTADOS_GESTIONABLES.join(', ')}` };
  }
  if (estado === 'RECHAZADA' && !motivoRechazo?.trim()) {
    throw { status: 400, message: 'El motivo de rechazo es obligatorio para rechazar una reserva' };
  }

  try {
    // Se pasa el motivo de rechazo como `app.motivo` para que fn_historial_reserva lo
    // registre en historial_reserva.motivo (antes se perdía: quedaba solo en
    // reserva.motivo_rechazo y nunca llegaba al historial).
    return await runWithUsuario(
      usuarioId,
      (transaction) => repo.cambiarEstado(id, estado, usuarioId, motivoRechazo, { transaction }),
      { motivo: motivoRechazo },
    );
  } catch (error) {
    traducirErrorTrigger(error);
  }
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
  remove,
};
