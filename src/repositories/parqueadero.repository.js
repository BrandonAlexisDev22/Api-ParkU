/**
 * @module ParqueaderoRepository
 * @description Operaciones de base de datos para la tabla 'parqueadero' usando Sequelize.
 */

const { Parqueadero } = require('../models');

/**
 * Busca un parqueadero por su nombre exacto.
 * @param {string} nombre
 * @returns {Promise<Object|null>}
 */
const findByNombre = async (nombre) => {
  const row = await Parqueadero.findOne({ where: { nombre } });
  return row ? row.toJSON() : null;
};

/**
 * Recupera todos los parqueaderos.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const rows = await Parqueadero.findAll();
  return rows.map((r) => r.toJSON());
};

/**
 * Busca un parqueadero por su identificador.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const row = await Parqueadero.findByPk(id);
  return row ? row.toJSON() : null;
};

/**
 * Crea un nuevo parqueadero.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  const nuevo = await Parqueadero.create(data);
  return findById(nuevo.id);
};

/**
 * Actualiza parcialmente un parqueadero existente.
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const update = async (id, data) => {
  if (Object.keys(data).length === 0) {
    return findById(id);
  }
  await Parqueadero.update(data, { where: { id } });
  return findById(id);
};

/**
 * Elimina un parqueadero.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const filasEliminadas = await Parqueadero.destroy({ where: { id } });
  return filasEliminadas > 0;
};

module.exports = { findAll, findById, findByNombre, create, update, remove };