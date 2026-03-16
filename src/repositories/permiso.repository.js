/**
 * @module PermisoRepository
 * @description Capa de acceso a datos para la tabla 'permiso'.
 * Define las acciones granulares que pueden ser asignadas a los roles.
 */

const db = require('../config/database');

/**
 * Recupera el catálogo completo de permisos del sistema.
 * @returns {Promise<Array>} Lista de permisos disponibles.
 */
const findAll = async () => {
  const [rows] = await db.query('SELECT * FROM permiso');
  return rows;
};

/**
 * Busca un permiso por su ID primario.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM permiso WHERE id = ?', [id]);
  return rows[0] || null;
};

/**
 * Busca un permiso por su nombre (ej. 'GESTIONAR_REPORTES').
 * Útil para validaciones de existencia antes de asignar a un rol.
 * @param {string} nombre 
 * @returns {Promise<Object|null>}
 */
const findByNombre = async (nombre) => {
  const [rows] = await db.query('SELECT * FROM permiso WHERE nombre = ?', [nombre]);
  return rows[0] || null;
};

/**
 * Registra un nuevo permiso en el sistema.
 * @param {string} nombre - Nombre del permiso (recomendado SNAKE_CASE).
 * @returns {Promise<Object>} El permiso creado.
 */
const create = async (nombre) => {
  const [result] = await db.query('INSERT INTO permiso (nombre) VALUES (?)', [nombre]);
  return findById(result.insertId);
};

/**
 * Modifica el nombre de un permiso existente.
 * @param {number} id 
 * @param {string} nombre - Nuevo nombre del permiso.
 * @returns {Promise<Object>} El permiso actualizado.
 */
const update = async (id, nombre) => {
  await db.query('UPDATE permiso SET nombre = ? WHERE id = ?', [nombre, id]);
  return findById(id);
};

/**
 * Elimina un permiso. 
 * Advertencia: Esto fallará si el permiso está asignado a un rol debido a restricciones de integridad.
 * @param {number} id 
 * @returns {Promise<boolean>} True si la eliminación fue efectiva.
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM permiso WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByNombre, create, update, remove };