/**
 * @module PerfilRepository
 * @description Capa de acceso a datos para la tabla 'perfil'.
 * Gestiona las categorías institucionales a las que pertenecen los conductores.
 */

const db = require('../config/database');

/**
 * Recupera todos los perfiles registrados en el sistema.
 * @returns {Promise<Array>} Lista de perfiles (id, nombre, descripcion).
 */
const findAll = async () => {
  const [rows] = await db.query('SELECT * FROM perfil');
  return rows;
};

/**
 * Busca un perfil específico por su ID.
 * @param {number} id - Identificador único del perfil.
 * @returns {Promise<Object|null>} El objeto del perfil o null si no existe.
 */
const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM perfil WHERE id = ?', [id]);
  return rows[0] || null;
};

/**
 * Crea una nueva categoría de perfil.
 * @param {Object} data - Objeto con los datos del perfil.
 * @param {string} data.nombre - Nombre del perfil (ej. Estudiante).
 * @param {string} [data.descripcion] - Detalles adicionales sobre el perfil.
 * @returns {Promise<Object>} El perfil recién creado.
 */
const create = async ({ nombre, descripcion }) => {
  const [result] = await db.query(
    'INSERT INTO perfil (nombre, descripcion) VALUES (?, ?)',
    [nombre, descripcion || null]
  );
  return findById(result.insertId);
};

/**
 * Actualiza la información de un perfil existente.
 * @param {number} id - ID del perfil a modificar.
 * @param {Object} data - { nombre, descripcion }
 * @returns {Promise<Object>} El perfil con los datos actualizados.
 */
const update = async (id, { nombre, descripcion }) => {
  await db.query(
    'UPDATE perfil SET nombre = ?, descripcion = ? WHERE id = ?',
    [nombre, descripcion || null, id]
  );
  return findById(id);
};

/**
 * Elimina un perfil de la base de datos.
 * @param {number} id - ID del perfil a eliminar.
 * @returns {Promise<boolean>} True si la eliminación fue exitosa.
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM perfil WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, create, update, remove };