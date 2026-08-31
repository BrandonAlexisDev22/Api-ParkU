/**
 * @module ReservaRepository
 * @description Capa de persistencia para la gestión de reservas de celdas.
 * Toda escritura requiere contexto de usuario (auditoría/historial vía triggers) --
 * ver reserva.service.js y dbContext.util.js. La BD también valida solapamientos
 * (fn_validar_conflicto_reserva); la comprobación aquí es una segunda barrera para
 * devolver un 409 con buen mensaje antes de llegar a la excepción de Postgres.
 */

const { Op } = require('sequelize');
const { Reserva, Celda, Usuario, Conductor, Vehiculo } = require('../models');

const includeContexto = [
  { model: Celda, as: 'celda', attributes: ['id', 'numero', 'parqueadero'] },
  { model: Usuario, as: 'usuarioRegistra', attributes: ['id', 'nombre'] },
  { model: Conductor, as: 'conductor', attributes: ['id', 'nombre_apellidos'] },
  { model: Vehiculo, as: 'vehiculo', attributes: ['id', 'placa'] },
];

/**
 * Recupera todas las reservas ordenadas cronológicamente por inicio.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const rows = await Reserva.findAll({ include: includeContexto, order: [['fecha_hora_inicio', 'DESC']] });
  return rows.map((r) => r.toJSON());
};

/**
 * Busca una reserva específica por su ID.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const row = await Reserva.findByPk(id, { include: includeContexto });
  return row ? row.toJSON() : null;
};

/**
 * Obtiene el historial de reservas de un vehículo.
 * @param {number} vehiculoId
 * @returns {Promise<Array>}
 */
const findByVehiculo = async (vehiculoId) => {
  const rows = await Reserva.findAll({
    where: { vehiculo_id: vehiculoId },
    include: includeContexto,
    order: [['fecha_hora_inicio', 'DESC']],
  });
  return rows.map((r) => r.toJSON());
};

/**
 * Obtiene la agenda de reservas de una celda específica.
 * @param {number} celdaId
 * @returns {Promise<Array>}
 */
const findByCelda = async (celdaId) => {
  const rows = await Reserva.findAll({
    where: { celda_id: celdaId },
    include: includeContexto,
    order: [['fecha_hora_inicio', 'DESC']],
  });
  return rows.map((r) => r.toJSON());
};

/**
 * Detecta conflictos de horario para una celda (solo reservas PENDIENTE/ACEPTADA).
 * @param {number} celdaId
 * @param {string|Date} inicio
 * @param {string|Date} fin
 * @param {number|null} [excludeId] - ID de reserva a ignorar (útil en actualizaciones).
 * @returns {Promise<Array>}
 */
const findConflictos = async (celdaId, inicio, fin, excludeId = null) => {
  const where = {
    celda_id: celdaId,
    estado: { [Op.in]: ['PENDIENTE', 'ACEPTADA'] },
    fecha_hora_inicio: { [Op.lt]: fin },
    fecha_hora_fin: { [Op.gt]: inicio },
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };

  const rows = await Reserva.findAll({ where });
  return rows.map((r) => r.toJSON());
};

/**
 * Crea una nueva reserva en el sistema.
 * @param {Object} data
 * @param {import('sequelize').Transaction} opciones.transaction
 * @returns {Promise<Object>} La reserva creada con su contexto.
 */
const create = async (data, { transaction } = {}) => {
  const {
    tipo_reserva, celda_id, usuario_registra_id, conductor_id, vehiculo_id,
    motivo, fecha_hora_inicio, fecha_hora_fin, estado = 'PENDIENTE',
  } = data;

  const nueva = await Reserva.create(
    { tipo_reserva, celda_id, usuario_registra_id, conductor_id, vehiculo_id, motivo, fecha_hora_inicio, fecha_hora_fin, estado },
    { transaction }
  );
  return findById(nueva.id);
};

/**
 * Actualiza parcialmente una reserva existente (no toca estado; usar cambiarEstado).
 * @param {number} id
 * @param {Object} data - Campos a actualizar (todos opcionales).
 * @param {import('sequelize').Transaction} opciones.transaction
 * @returns {Promise<Object>}
 */
const update = async (id, data, { transaction } = {}) => {
  const allowedFields = ['tipo_reserva', 'celda_id', 'conductor_id', 'vehiculo_id', 'motivo', 'fecha_hora_inicio', 'fecha_hora_fin'];
  const cambios = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) cambios[field] = data[field];
  }
  if (Object.keys(cambios).length === 0) {
    return findById(id);
  }
  await Reserva.update(cambios, { where: { id }, transaction });
  return findById(id);
};

/**
 * Cambia el estado de una reserva (aceptar/rechazar/cancelar/terminar). La BD
 * bloquea o libera la celda sola vía fn_reserva_bloquea_celda.
 * @param {number} id
 * @param {string} estado
 * @param {number|null} usuarioGestionaId
 * @param {import('sequelize').Transaction} opciones.transaction
 * @returns {Promise<Object>}
 */
const cambiarEstado = async (id, estado, usuarioGestionaId, motivoRechazo, { transaction } = {}) => {
  const cambios = { estado };
  if (usuarioGestionaId) cambios.usuario_gestiona_id = usuarioGestionaId;
  if (motivoRechazo !== undefined) cambios.motivo_rechazo = motivoRechazo;
  await Reserva.update(cambios, { where: { id }, transaction });
  return findById(id);
};

/**
 * Elimina una reserva del sistema.
 * @param {number} id
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<boolean>}
 */
const remove = async (id, { transaction } = {}) => {
  const filasEliminadas = await Reserva.destroy({ where: { id }, transaction });
  return filasEliminadas > 0;
};

module.exports = {
  findAll,
  findById,
  findByVehiculo,
  findByCelda,
  findConflictos,
  create,
  update,
  cambiarEstado,
  remove,
};
