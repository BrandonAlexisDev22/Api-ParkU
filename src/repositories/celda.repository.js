/**
 * @module CeldaRepository
 * @description Operaciones de base de datos para la tabla 'celda' usando Sequelize.
 * Incluye JOIN con parqueadero para obtener el nombre de la sede.
 */

const { Celda, Parqueadero } = require('../models');

/**
 * Aplana el resultado de Sequelize para mantener el mismo shape
 * que tenía la versión anterior con SQL manual (parqueadero_nombre plano).
 * @param {import('sequelize').Model} instancia
 * @returns {Object|null}
 */
const mapCelda = (instancia) => {
  if (!instancia) return null;
  const plano = instancia.toJSON();
  const { Parqueadero: parq, ...resto } = plano;
  return {
    ...resto,
    parqueadero_nombre: parq ? parq.nombre : null,
  };
};

const includeParqueadero = {
  model: Parqueadero,
  as: 'Parqueadero',
  attributes: ['nombre'],
};

/**
 * Recupera todas las celdas del sistema.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const rows = await Celda.findAll({ include: [includeParqueadero] });
  return rows.map(mapCelda);
};

/**
 * Busca una celda por su identificador.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const row = await Celda.findByPk(id, { include: [includeParqueadero] });
  return mapCelda(row);
};

/**
 * Obtiene todas las celdas de un parqueadero específico.
 * @param {number} parqueaderoId
 * @returns {Promise<Array>}
 */
const findByParqueadero = async (parqueaderoId) => {
  const rows = await Celda.findAll({
    where: { parqueadero: parqueaderoId },
    include: [includeParqueadero],
  });
  return rows.map(mapCelda);
};

/**
 * Filtra celdas disponibles (estado_celda = 'DISPONIBLE') en un parqueadero.
 * @param {number} parqueaderoId
 * @returns {Promise<Array>}
 */
const findDisponibles = async (parqueaderoId) => {
  const rows = await Celda.findAll({
    where: { parqueadero: parqueaderoId, estado_celda: 'DISPONIBLE' },
    include: [includeParqueadero],
  });
  return rows.map(mapCelda);
};

/**
 * Filtra celdas por tipo (aprovecha el índice/enum en vez de filtrar en memoria).
 * @param {string} tipo
 * @returns {Promise<Array>}
 */
const findByTipo = async (tipo) => {
  const rows = await Celda.findAll({
    where: { tipo },
    include: [includeParqueadero],
  });
  return rows.map(mapCelda);
};

/**
 * Filtra celdas por usabilidad.
 * @param {string} usabilidad
 * @returns {Promise<Array>}
 */
const findByUsabilidad = async (usabilidad) => {
  const rows = await Celda.findAll({
    where: { usabilidad },
    include: [includeParqueadero],
  });
  return rows.map(mapCelda);
};

/**
 * Crea una nueva celda en la base de datos.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const create = async ({ parqueadero, tipo, usabilidad, estado_celda = 'DISPONIBLE' }) => {
  const nueva = await Celda.create({ parqueadero, tipo, usabilidad, estado_celda });
  return findById(nueva.id);
};

/**
 * Actualiza parcialmente una celda existente.
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const update = async (id, { tipo, usabilidad, estado_celda }) => {
  const cambios = {};
  if (tipo !== undefined) cambios.tipo = tipo;
  if (usabilidad !== undefined) cambios.usabilidad = usabilidad;
  if (estado_celda !== undefined) cambios.estado_celda = estado_celda;

  if (Object.keys(cambios).length === 0) {
    return findById(id);
  }

  await Celda.update(cambios, { where: { id } });
  return findById(id);
};

/**
 * Elimina una celda de la base de datos.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const filasEliminadas = await Celda.destroy({ where: { id } });
  return filasEliminadas > 0;
};

module.exports = {
  findAll,
  findById,
  findByParqueadero,
  findDisponibles,
  findByTipo,
  findByUsabilidad,
  create,
  update,
  remove,
};