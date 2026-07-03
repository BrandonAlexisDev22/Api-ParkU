/**
 * @module PermisoRepository
 * @description Capa de acceso a datos para la tabla 'permiso'.
 * Gestiona los permisos del sistema (ej. crear_usuarios, eliminar_celdas, etc.).
 */

const db = require('../config/database');

/**
 * Consulta base.
 * @constant {string}
 */
const BASE_QUERY = 'SELECT * FROM permiso';

/**
 * Recupera todos los permisos registrados, ordenados por nombre.
 * @returns {Promise<Array>} Lista de permisos.
 */
const findAll = async () => {
  const [rows] = await db.query(`${BASE_QUERY} ORDER BY nombre`);
  return rows;
};

/**
 * Busca un permiso por su ID.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE id = ?`, [id]);
  return rows[0] || null;
};

/**
 * Busca un permiso por su nombre exacto (para validaciones de unicidad).
 * @param {string} nombre
 * @returns {Promise<Object|null>}
 */
const findByNombre = async (nombre) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE nombre = ?`, [nombre]);
  return rows[0] || null;
};

/**
 * Crea un nuevo permiso.
 * @param {Object} data - { nombre }
 * @returns {Promise<Object>} Permiso creado.
 */
const create = async ({ nombre }) => {
  const [result] = await db.query(
    'INSERT INTO permiso (nombre) VALUES (?)',
    [nombre]
  );
  return findById(result.insertId);
};

/**
 * Actualiza parcialmente un permiso existente.
 * @param {number} id
 * @param {Object} data - { nombre }
 * @returns {Promise<Object>} Permiso actualizado.
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
 * Elimina un permiso de la base de datos.
 * @param {number} id
 * @returns {Promise<boolean>} True si se eliminó.
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM permiso WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByNombre, create, update, remove };