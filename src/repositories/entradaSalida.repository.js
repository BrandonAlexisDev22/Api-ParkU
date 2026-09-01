/**
 * @module RegistroAccesoRepository
 * @description Capa de persistencia para 'registro_acceso' (reemplaza a ingreso_salida).
 * Un solo registro cubre ingreso y salida. Toda escritura requiere contexto de usuario
 * (auditoría vía trigger); además, insertar con celda_id dispara fn_registro_ingreso_celda
 * y actualizar fecha_hora_salida dispara fn_registro_salida_celda -- ver
 * entradaSalida.service.js y dbContext.util.js.
 */

const { Op } = require('sequelize');
const { RegistroAcceso, Vehiculo, Conductor, Parqueadero, Celda } = require('../models');

const includeContexto = [
  { model: Vehiculo, as: 'vehiculo', attributes: ['id', 'placa', 'tipo'] },
  {
    model: Conductor,
    as: 'conductor',
    attributes: ['id', 'tipo_documento', 'numero_documento', 'nombre_apellidos', 'correo', 'numero_telefonico'],
  },
  { model: Parqueadero, as: 'parqueadero', attributes: ['id', 'nombre'] },
  { model: Celda, as: 'celda', attributes: ['id', 'numero', 'tipo'] },
];

/**
 * Recupera todo el historial de movimientos, más reciente primero.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const rows = await RegistroAcceso.findAll({ include: includeContexto, order: [['fecha_hora_ingreso', 'DESC']] });
  return rows.map((r) => r.toJSON());
};

/**
 * Obtiene un registro de movimiento específico.
 * @param {number} id
 * @param {import('sequelize').Transaction} [opciones.transaction] - Pasarla cuando se llama
 *   justo después de un create/update en la misma transacción: si no, esta lectura sale por
 *   otra conexión del pool y no ve la fila todavía sin confirmar (queda en null).
 * @returns {Promise<Object|null>}
 */
const findById = async (id, { transaction } = {}) => {
  const row = await RegistroAcceso.findByPk(id, { include: includeContexto, transaction });
  return row ? row.toJSON() : null;
};

/**
 * Obtiene el historial de movimientos de un vehículo en particular.
 * @param {number} vehiculoId
 * @returns {Promise<Array>}
 */
const findByVehiculo = async (vehiculoId) => {
  const rows = await RegistroAcceso.findAll({
    where: { vehiculo_id: vehiculoId },
    include: includeContexto,
    order: [['fecha_hora_ingreso', 'DESC']],
  });
  return rows.map((r) => r.toJSON());
};

/**
 * Busca el ingreso abierto (sin salida) de un vehículo, si existe.
 * @param {number} vehiculoId
 * @returns {Promise<Object|null>}
 */
const findIngresoAbierto = async (vehiculoId) => {
  const row = await RegistroAcceso.findOne({
    where: { vehiculo_id: vehiculoId, fecha_hora_salida: null },
    include: includeContexto,
  });
  return row ? row.toJSON() : null;
};

/**
 * Ingresos actualmente activos (sin salida registrada) -- base del monitoreo en vivo del
 * parqueadero. Opcionalmente filtrado por parqueadero.
 * @param {number} [parqueaderoId]
 * @returns {Promise<Array>}
 */
const findActivos = async (parqueaderoId) => {
  const where = { fecha_hora_salida: null };
  if (parqueaderoId) where.parqueadero_id = parqueaderoId;

  const rows = await RegistroAcceso.findAll({
    where,
    include: includeContexto,
    order: [['fecha_hora_ingreso', 'ASC']],
  });
  return rows.map((r) => r.toJSON());
};

/**
 * Busca registros dentro de un rango de tiempo específico.
 * @param {string|Date} desde
 * @param {string|Date} hasta
 * @returns {Promise<Array>}
 */
const findByFecha = async (desde, hasta) => {
  const rows = await RegistroAcceso.findAll({
    where: { fecha_hora_ingreso: { [Op.between]: [desde, hasta] } },
    include: includeContexto,
    order: [['fecha_hora_ingreso', 'DESC']],
  });
  return rows.map((r) => r.toJSON());
};

/**
 * Registra el ingreso de un vehículo. Si trae celda_id, el trigger de la BD ocupa
 * la celda y valida tipo/estado/reserva.
 * @param {Object} data
 * @param {import('sequelize').Transaction} opciones.transaction
 * @returns {Promise<Object>}
 */
const registrarIngreso = async (data, { transaction } = {}) => {
  const { vehiculo_id, conductor_id, parqueadero_id, celda_id, reserva_id, usuario_ingreso_id, descripcion_ingreso, fecha_hora_ingreso } = data;
  const nuevo = await RegistroAcceso.create(
    {
      vehiculo_id,
      conductor_id: conductor_id || null,
      parqueadero_id,
      celda_id: celda_id || null,
      reserva_id: reserva_id || null,
      usuario_ingreso_id,
      descripcion_ingreso: descripcion_ingreso || null,
      fecha_hora_ingreso: fecha_hora_ingreso || undefined,
      estado: 'DENTRO',
    },
    { transaction }
  );
  return findById(nuevo.id, { transaction });
};

/**
 * Registra la salida de un vehículo sobre un registro de ingreso ya existente.
 * El trigger de la BD libera (o vuelve a reservar) la celda.
 * @param {number} id - ID del registro de ingreso abierto.
 * @param {Object} data - { usuario_salida_id, descripcion_salida?, fecha_hora_salida? }
 * @param {import('sequelize').Transaction} opciones.transaction
 * @returns {Promise<Object>}
 */
const registrarSalida = async (id, { usuario_salida_id, descripcion_salida, fecha_hora_salida }, { transaction } = {}) => {
  await RegistroAcceso.update(
    {
      usuario_salida_id,
      descripcion_salida: descripcion_salida || null,
      fecha_hora_salida: fecha_hora_salida || new Date(),
      estado: 'FINALIZADO',
    },
    { where: { id }, transaction }
  );
  return findById(id, { transaction });
};

/**
 * Elimina un registro del historial (uso administrativo/corrección).
 * @param {number} id
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<boolean>}
 */
const remove = async (id, { transaction } = {}) => {
  const filasEliminadas = await RegistroAcceso.destroy({ where: { id }, transaction });
  return filasEliminadas > 0;
};

module.exports = {
  findAll,
  findById,
  findByVehiculo,
  findIngresoAbierto,
  findActivos,
  findByFecha,
  registrarIngreso,
  registrarSalida,
  remove,
};
