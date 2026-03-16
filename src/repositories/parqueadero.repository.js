/**
 * @module ParqueaderoRepository
 * @description Capa de acceso a datos para la tabla 'parqueadero'.
 * Gestiona la información de las sedes físicas del sistema.
 */

const db = require('../config/database');

/**
 * Obtiene todas las sedes registradas.
 * @returns {Promise<Array>} Lista de parqueaderos.
 */
const findAll = async () => {
  const [rows] = await db.query('SELECT * FROM parqueadero');
  return rows;
};

/**
 * Busca una sede por su ID único.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM parqueadero WHERE id = ?', [id]);
  return rows[0] || null;
};

/**
 * Busca una sede por nombre exacto. 
 * Útil para validaciones de duplicidad antes de insertar.
 * @param {string} nombre 
 * @returns {Promise<Object|null>}
 */
const findByNombre = async (nombre) => {
  const [rows] = await db.query('SELECT * FROM parqueadero WHERE nombre = ?', [nombre]);
  return rows[0] || null;
};

/**
 * Inserta una nueva sede en el sistema.
 * @param {Object} data - { nombre, ubicacion, descripcion }
 * @returns {Promise<Object>} La sede recién creada.
 */
const create = async ({ nombre, ubicacion, descripcion }) => {
  const [result] = await db.query(
    'INSERT INTO parqueadero (nombre, ubicacion, descripcion) VALUES (?, ?, ?)',
    [nombre, ubicacion || null, descripcion || null]
  );
  return findById(result.insertId);
};

/**
 * Actualiza la información y el estado operativo de una sede.
 * @param {number} id 
 * @param {Object} data - { nombre, ubicacion, descripcion, estado }
 * @returns {Promise<Object>} La sede actualizada.
 */
const update = async (id, { nombre, ubicacion, descripcion, estado }) => {
  await db.query(
    'UPDATE parqueadero SET nombre=?, ubicacion=?, descripcion=?, estado=? WHERE id=?',
    [nombre, ubicacion || null, descripcion || null, estado ?? 1, id]
  );
  return findById(id);
};

/**
 * Elimina una sede de la base de datos.
 * Nota: Esto podría fallar si hay celdas asociadas (Integridad referencial).
 * @param {number} id 
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM parqueadero WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByNombre, create, update, remove };