/**
 * @module CeldaRepository
 * @description Operaciones de base de datos para la tabla 'celda'. 
 * Incluye integración con la tabla 'parqueadero' para obtener nombres de sedes.
 */

const db = require('../config/database');

/**
 * Consulta base para reutilizar en búsquedas.
 * @constant {string}
 */
const BASE_QUERY = `
  SELECT c.*, p.nombre AS parqueadero_nombre
  FROM celda c
  JOIN parqueadero p ON c.parqueadero = p.id
`;

/**
 * Recupera todas las celdas del sistema.
 * @returns {Promise<Array>} Listado de celdas con datos de parqueadero.
 */
const findAll = async () => {
  const [rows] = await db.query(BASE_QUERY);
  return rows;
};

/**
 * Busca una celda por su identificador único.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE c.id = ?`, [id]);
  return rows[0] || null;
};

/**
 * Obtiene todas las celdas de un parqueadero específico.
 * @param {number} parqueaderoId 
 * @returns {Promise<Array>}
 */
const findByParqueadero = async (parqueaderoId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE c.parqueadero = ?`, [parqueaderoId]
  );
  return rows;
};

/**
 * Filtra celdas disponibles (estado = 1) en una sede.
 * @param {number} parqueaderoId 
 * @returns {Promise<Array>}
 */
const findDisponibles = async (parqueaderoId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE c.parqueadero = ? AND c.estado = 1`, [parqueaderoId]
  );
  return rows;
};

/**
 * Inserta una nueva celda en la base de datos.
 * @param {Object} data - { parqueadero, discapacidad }
 * @returns {Promise<Object>} La celda recién creada.
 */
const create = async ({ parqueadero, discapacidad }) => {
  const [result] = await db.query(
    'INSERT INTO celda (parqueadero, discapacidad) VALUES (?, ?)',
    [parqueadero, discapacidad ? 1 : 0]
  );
  return findById(result.insertId);
};

/**
 * Actualiza los atributos de una celda.
 * @param {number} id 
 * @param {Object} data - { discapacidad, estado }
 * @returns {Promise<Object>} La celda actualizada.
 */
const update = async (id, { discapacidad, estado }) => {
  await db.query(
    'UPDATE celda SET discapacidad = ?, estado = ? WHERE id = ?',
    [discapacidad ?? 0, estado ?? 1, id]
  );
  return findById(id);
};

/**
 * Elimina una celda de la base de datos.
 * @param {number} id 
 * @returns {Promise<boolean>} True si se eliminó algún registro.
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM celda WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByParqueadero, findDisponibles, create, update, remove };