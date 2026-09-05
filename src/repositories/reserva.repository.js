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
 * @param {import('sequelize').Transaction} [opciones.transaction] - Pasarla cuando se llama
 *   justo después de un create/update en la misma transacción: si no, esta lectura sale por
 *   otra conexión del pool y no ve la fila todavía sin confirmar (queda en null).
 * @returns {Promise<Object|null>}
 */
const findById = async (id, { transaction } = {}) => {
  const row = await Reserva.findByPk(id, { include: includeContexto, transaction });
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
 * Reservas PENDIENTE/ACEPTADA (no gestionadas o vigentes) de un parqueadero, vía su celda
 * -- reserva no tiene parqueadero_id propio. Usada por la cascada de desactivación de
 * parqueadero (parqueadero.service.js) para cancelarlas todas dentro de la misma
 * transacción.
 * @param {number} parqueaderoId
 * @param {import('sequelize').Transaction} opciones.transaction
 * @param {boolean} [opciones.lock]
 * @returns {Promise<Array>}
 */
const findActivasPorParqueadero = async (parqueaderoId, { transaction, lock } = {}) => {
  const rows = await Reserva.findAll({
    where: { estado: { [Op.in]: ['PENDIENTE', 'ACEPTADA'] } },
    include: [{ model: Celda, as: 'celda', attributes: [], where: { parqueadero: parqueaderoId }, required: true }],
    transaction,
    // Lock solo sobre 'reserva' (of: Reserva): el JOIN con celda es solo para filtrar por
    // parqueadero (attributes: [] -- no trae columnas de celda), así que no hay lado
    // nullable de outer join que bloquear.
    lock: lock && transaction ? { level: transaction.LOCK.UPDATE, of: Reserva } : undefined,
  });
  return rows.map((r) => r.toJSON());
};

/**
 * Reservas que ya no tienen sentido (ver vencerCaducadas en el service): las ACEPTADAS a las
 * que se les pasó el margen de llegada, y las PENDIENTES que llegaron al margen de
 * confirmación sin que nadie las aprobara.
 * @param {Date} limiteConfirmacion - `ahora` más el margen de confirmación.
 * @param {Date} limiteLlegada - `ahora` menos el margen de llegada.
 * @returns {Promise<Array>}
 */
const findCaducadas = async (limiteConfirmacion, limiteLlegada) => {
  const rows = await Reserva.findAll({
    where: {
      [Op.or]: [
        { estado: 'ACEPTADA', fecha_hora_inicio: { [Op.lt]: limiteLlegada } },
        { estado: 'PENDIENTE', fecha_hora_inicio: { [Op.lt]: limiteConfirmacion } },
      ],
    },
    order: [['fecha_hora_inicio', 'ASC']],
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
 * Reserva que está reteniendo una celda: la ACEPTADA más próxima que todavía no ha
 * terminado. Es la que explica por qué celda.estado vale RESERVADA.
 *
 * No se filtra por "que contenga este instante" a propósito. El trigger
 * fn_reserva_bloquea_celda pone la celda en RESERVADA en cuanto la reserva se acepta,
 * aunque sea para dentro de tres horas; si aquí solo se miraran las reservas vigentes
 * ahora mismo, la celda quedaría retenida pero sin dueño identificable, y cualquier otro
 * vehículo podría ocuparla o un administrador liberarla sin enterarse de que hay alguien
 * esperándola.
 *
 * @param {number} celdaId
 * @param {Date} [momento] - Referencia temporal; por defecto, ahora.
 * @returns {Promise<Object|null>}
 */
const findReservaQueBloquea = async (celdaId, momento = new Date(), { transaction } = {}) => {
  const row = await Reserva.findOne({
    where: {
      celda_id: celdaId,
      estado: 'ACEPTADA',
      fecha_hora_fin: { [Op.gt]: momento },
    },
    order: [['fecha_hora_inicio', 'ASC']],
    transaction,
  });
  return row ? row.toJSON() : null;
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
    // Obligatorio para cualquier estado distinto de PENDIENTE: la BD lo exige con
    // chk_reserva_gestion. Antes no estaba en esta lista, así que crear una reserva ya
    // aceptada (la que registra un Admin/Vigilante) reventaba contra el CHECK.
    usuario_gestiona_id = null,
  } = data;

  const nueva = await Reserva.create(
    {
      tipo_reserva, celda_id, usuario_registra_id, conductor_id, vehiculo_id,
      motivo, fecha_hora_inicio, fecha_hora_fin, estado, usuario_gestiona_id,
    },
    { transaction }
  );
  return findById(nueva.id, { transaction });
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
    return findById(id, { transaction });
  }
  await Reserva.update(cambios, { where: { id }, transaction });
  return findById(id, { transaction });
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
  return findById(id, { transaction });
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
  findActivasPorParqueadero,
  findCaducadas,
  findConflictos,
  findReservaQueBloquea,
  create,
  update,
  cambiarEstado,
  remove,
};
