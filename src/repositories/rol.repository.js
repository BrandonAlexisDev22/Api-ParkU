/**
 * @module RolRepository
 * @description Capa de acceso a datos para la tabla 'rol'.
 * Define los niveles de acceso y agrupaciones de usuarios en el sistema.
 */

const db = require('../config/database');

/**
 * Recupera todos los roles definidos en el sistema.
 * @returns {Promise<Array>} Lista de objetos de rol.
 */
const findAll = async () => {
  const [rows] = await db.query('SELECT * FROM rol');
  return rows;
};

/**
 * Busca un rol específico por su identificador numérico.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM rol WHERE id = ?', [id]);
  return rows[0] || null;
};

/**
 * Busca un rol por su nombre (ej. 'ADMIN', 'VIGILANTE').
 * @param {string} nombre 
 * @returns {Promise<Object|null>}
 */
const findByNombre = async (nombre) => {
  const [rows] = await db.query('SELECT * FROM rol WHERE nombre = ?', [nombre]);
  return rows[0] || null;
};

/**
 * Inserta un nuevo rol en la base de datos.
 * @param {string} nombre - Etiqueta del rol.
 * @returns {Promise<Object>} El rol recién creado.
 */
const create = async (nombre) => {
  const [result] = await db.query('INSERT INTO rol (nombre) VALUES (?)', [nombre]);
  return findById(result.insertId);
};

/**
 * Actualiza el nombre de un rol existente.
 * @param {number} id 
 * @param {string} nombre 
 * @returns {Promise<Object>} El rol actualizado.
 */
const update = async (id, nombre) => {
  await db.query('UPDATE rol SET nombre = ? WHERE id = ?', [nombre, id]);
  return findById(id);
};

/**
 * Elimina un rol del sistema.
 * Advertencia: La integridad referencial impedirá el borrado si hay usuarios vinculados.
 * @param {number} id 
 * @returns {Promise<boolean>} True si se eliminó correctamente.
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM rol WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByNombre, create, update, remove };