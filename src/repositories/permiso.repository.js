/**
 * @module PermisoRepository
 * @description Capa de acceso a datos para la tabla 'permiso'.
 * Alineado con el modelo Permiso (id, nombre).
 * Incluye validación de duplicados y actualización parcial.
 */

const db = require('../config/database');

/**
 * Consulta base.
 * @constant {string}
 */
const BASE_QUERY = 'SELECT * FROM permiso';

/**
 * Recupera el catálogo completo de permisos del sistema, ordenados por nombre.
 * @returns {Promise<Array>} Lista de permisos disponibles.
 */
const findAll = async () => {
  const [rows] = await db.query(`${BASE_QUERY} ORDER BY nombre`);
  return rows;
};

/**
 * Busca un permiso por su ID primario.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE id = ?`, [id]);
  return rows[0] || null;
};

/**
 * Busca un permiso por su nombre (ej. 'GESTIONAR_REPORTES').
 * Útil para validaciones de existencia antes de asignar a un rol.
 * @param {string} nombre 
 * @returns {Promise<Object|null>}
 */
const findByNombre = async (nombre) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE nombre = ?`, [nombre]);
  return rows[0] || null;
};

/**
 * Registra un nuevo permiso en el sistema.
 * @param {Object} data - { nombre }
 * @param {string} data.nombre - Nombre del permiso (recomendado SNAKE_CASE).
 * @returns {Promise<Object>} El permiso creado.
 */
const create = async ({ nombre }) => {
  const [result] = await db.query('INSERT INTO permiso (nombre) VALUES (?)', [nombre]);
  return findById(result.insertId);
};

/**
 * Modifica el nombre de un permiso existente (actualización parcial).
 * @param {number} id 
 * @param {Object} data - { nombre } (opcional, solo se actualiza si se envía)
 * @returns {Promise<Object>} El permiso actualizado.
 */
const update = async (id, data) => {
  const fields = [];
  const values = [];
  if (data.nombre !== undefined) {
    fields.push('nombre = ?');
    values.push(data.nombre);
  }

  if (fields.length === 0) {
    // Si no se envía ningún campo, devolver sin cambios
    return findById(id);
  }

  values.push(id);
  const query = `UPDATE permiso SET ${fields.join(', ')} WHERE id = ?`;
  await db.query(query, values);
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