/**
 * @module CeldaRepository
 * @description Operaciones de base de datos para la tabla 'celda' usando Sequelize.
 * Incluye JOIN con parqueadero para obtener el nombre de la sede.
 *
 * celda.estado lo mueven los triggers de la BD (ingreso/salida, reservas). Las
 * escrituras de create/update/cambiarEstado deben ir dentro de una transacción con
 * SET LOCAL app.usuario_id -- ver src/utils/dbContext.util.js y celda.service.js.
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
  const rows = await Celda.findAll({ include: [includeParqueadero], order: [['parqueadero_id', 'ASC'], ['numero', 'ASC']] });
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
 * Busca una celda por parqueadero + número (clave única compuesta).
 * @param {number} parqueaderoId
 * @param {string} numero
 * @returns {Promise<Object|null>}
 */
const findByParqueaderoYNumero = async (parqueaderoId, numero) => {
  const row = await Celda.findOne({ where: { parqueadero: parqueaderoId, numero }, include: [includeParqueadero] });
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
    order: [['numero', 'ASC']],
  });
  return rows.map(mapCelda);
};

/**
 * Filtra celdas disponibles (estado = 'DISPONIBLE') en un parqueadero.
 * @param {number} parqueaderoId
 * @returns {Promise<Array>}
 */
const findDisponibles = async (parqueaderoId) => {
  const rows = await Celda.findAll({
    where: { parqueadero: parqueaderoId, estado: 'DISPONIBLE' },
    include: [includeParqueadero],
    order: [['numero', 'ASC']],
  });
  return rows.map(mapCelda);
};

/**
 * Filtra celdas por tipo de vehículo.
 * @param {string} tipo
 * @returns {Promise<Array>}
 */
const findByTipo = async (tipo) => {
  const rows = await Celda.findAll({ where: { tipo }, include: [includeParqueadero] });
  return rows.map(mapCelda);
};

/**
 * Filtra celdas por usabilidad.
 * @param {string} usabilidad
 * @returns {Promise<Array>}
 */
const findByUsabilidad = async (usabilidad) => {
  const rows = await Celda.findAll({ where: { usabilidad }, include: [includeParqueadero] });
  return rows.map(mapCelda);
};

/**
 * Crea una nueva celda en la base de datos.
 * @param {Object} data
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<Object>}
 */
const create = async ({ parqueadero, numero, tipo, usabilidad, estado = 'DISPONIBLE', observaciones, posicion_x, posicion_y, ancho, alto }, { transaction } = {}) => {
  const nueva = await Celda.create(
    { parqueadero, numero, tipo, usabilidad, estado, observaciones, posicion_x, posicion_y, ancho, alto },
    { transaction }
  );
  return findById(nueva.id);
};

/**
 * Actualiza parcialmente una celda existente (no toca estado; usar cambiarEstado).
 * @param {number} id
 * @param {Object} data
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<Object>}
 */
const update = async (id, data, { transaction } = {}) => {
  const allowedFields = ['numero', 'tipo', 'usabilidad', 'observaciones', 'posicion_x', 'posicion_y', 'ancho', 'alto'];
  const cambios = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) cambios[field] = data[field];
  }

  if (Object.keys(cambios).length === 0) {
    return findById(id);
  }

  await Celda.update(cambios, { where: { id }, transaction });
  return findById(id);
};

/**
 * Cambia el estado operativo de una celda (DISPONIBLE/MANTENIMIENTO/INACTIVA...).
 * Requiere contexto de usuario (ver celda.service.js) porque dispara auditoría e historial.
 * @param {number} id
 * @param {string} estado
 * @param {import('sequelize').Transaction} opciones.transaction
 * @returns {Promise<Object>}
 */
const cambiarEstado = async (id, estado, { transaction } = {}) => {
  await Celda.update({ estado }, { where: { id }, transaction });
  return findById(id);
};

/**
 * Elimina una celda de la base de datos.
 * @param {number} id
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<boolean>}
 */
const remove = async (id, { transaction } = {}) => {
  const filasEliminadas = await Celda.destroy({ where: { id }, transaction });
  return filasEliminadas > 0;
};

module.exports = {
  findAll,
  findById,
  findByParqueaderoYNumero,
  findByParqueadero,
  findDisponibles,
  findByTipo,
  findByUsabilidad,
  create,
  update,
  cambiarEstado,
  remove,
};
