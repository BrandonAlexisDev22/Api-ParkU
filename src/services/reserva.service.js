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
const { runWithUsuario, traducirErrorTrigger } = require('../utils/dbContext.util');
const { validarHorarioOperacion } = require('../config/horarioOperacion');

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
 * Valida que la celda y (si viene) el vehículo existan.
 * @private
 */
const _validarEntidades = async (celdaId, vehiculoId) => {
  if (celdaId !== undefined) {
    const celda = await celdaRepo.findById(celdaId);
    if (!celda) throw { status: 404, message: 'Celda no encontrada' };
  }
  if (vehiculoId) {
    const vehiculo = await vehRepo.findById(vehiculoId);
    if (!vehiculo) throw { status: 404, message: 'Vehículo no encontrado' };
  }
};

/**
 * Crea una reserva verificando disponibilidad horaria (la BD hace una segunda
 * validación de solapamiento y de celdas preferenciales).
 * @param {Object} data - { tipo_reserva, celda_id, conductor_id?, vehiculo_id?, motivo?, fecha_hora_inicio, fecha_hora_fin }
 * @param {number} usuarioId - Vigilante/administrador autenticado que registra la reserva.
 * @throws {Object} 400 datos faltantes/fechas inválidas, 404 entidades no encontradas, 409 conflicto de horario o regla de negocio.
 * @returns {Promise<Object>}
 */
const create = async ({ tipo_reserva, celda_id, conductor_id, vehiculo_id, motivo, fecha_hora_inicio, fecha_hora_fin }, usuarioId) => {
  if (!tipo_reserva || !celda_id || !fecha_hora_inicio || !fecha_hora_fin) {
    throw { status: 400, message: 'tipo_reserva, celda_id, fecha_hora_inicio y fecha_hora_fin son requeridos' };
  }

  validarHorarioOperacion();
  _validarFechas(fecha_hora_inicio, fecha_hora_fin);
  await _validarEntidades(celda_id, vehiculo_id);

  const conflictos = await repo.findConflictos(celda_id, fecha_hora_inicio, fecha_hora_fin);
  if (conflictos.length) {
    throw { status: 409, message: 'La celda ya tiene una reserva en ese horario' };
  }

  try {
    return await runWithUsuario(usuarioId, (transaction) => repo.create(
      { tipo_reserva, celda_id, usuario_registra_id: usuarioId, conductor_id, vehiculo_id, motivo, fecha_hora_inicio, fecha_hora_fin },
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
    return await runWithUsuario(usuarioId, (transaction) => repo.cambiarEstado(id, estado, usuarioId, motivoRechazo, { transaction }));
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

/**
 * Elimina una reserva.
 * @param {number} id
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 404 si no existe, 409 si no se puede eliminar (por integridad referencial).
 * @returns {Promise<boolean>}
 */
const remove = async (id, usuarioId) => {
  await getById(id);
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
