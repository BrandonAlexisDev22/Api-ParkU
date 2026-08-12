/**
 * @module OcupacionCeldaRepository
 * @description Lectura de 'ocupacion_celda'. La tabla se puebla sola desde
 * registro_acceso vía trigger; este repo es de solo lectura.
 */

const { OcupacionCelda, Celda, Vehiculo, Usuario } = require('../models');

const includeContexto = [
  { model: Celda, as: 'celda', attributes: ['id', 'numero', 'parqueadero'] },
  { model: Vehiculo, as: 'vehiculo', attributes: ['id', 'placa'] },
  { model: Usuario, as: 'usuarioAsigna', attributes: ['id', 'nombre'] },
];

/**
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const rows = await OcupacionCelda.findAll({ include: includeContexto, order: [['fecha_hora_inicio', 'DESC']] });
  return rows.map((r) => r.toJSON());
};

/**
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const row = await OcupacionCelda.findByPk(id, { include: includeContexto });
  return row ? row.toJSON() : null;
};

/**
 * Histórico de ocupación de una celda (más reciente primero).
 * @param {number} celdaId
 * @returns {Promise<Array>}
 */
const findByCelda = async (celdaId) => {
  const rows = await OcupacionCelda.findAll({
    where: { celda_id: celdaId },
    include: includeContexto,
    order: [['fecha_hora_inicio', 'DESC']],
  });
  return rows.map((r) => r.toJSON());
};

/**
 * Histórico de ocupación de un vehículo (más reciente primero).
 * @param {number} vehiculoId
 * @returns {Promise<Array>}
 */
const findByVehiculo = async (vehiculoId) => {
  const rows = await OcupacionCelda.findAll({
    where: { vehiculo_id: vehiculoId },
    include: includeContexto,
    order: [['fecha_hora_inicio', 'DESC']],
  });
  return rows.map((r) => r.toJSON());
};

/**
 * Ocupación actualmente activa de una celda, si existe.
 * @param {number} celdaId
 * @returns {Promise<Object|null>}
 */
const findActivaPorCelda = async (celdaId) => {
  const row = await OcupacionCelda.findOne({
    where: { celda_id: celdaId, estado: 'ACTIVA' },
    include: includeContexto,
  });
  return row ? row.toJSON() : null;
};

module.exports = { findAll, findById, findByCelda, findByVehiculo, findActivaPorCelda };
