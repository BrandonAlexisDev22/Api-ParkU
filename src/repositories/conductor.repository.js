/**
 * @module ConductorRepository
 * @description Capa de acceso a datos para la tabla 'conductor'.
 * Gestiona la relación entre los datos de usuario, sus atributos de conductor 
 * y su perfil institucional.
 */

const db = require('../config/database');

/**
 * Consulta base que integra información de las tablas usuario y perfil.
 * @constant {string}
 */
const BASE_QUERY = `
  SELECT c.id, c.discapacidad,
         u.id AS usuario_id, u.nombre, u.correo, u.numero,
         p.id AS perfil_id, p.nombre AS perfil_nombre
  FROM conductor c
  JOIN usuario u     ON c.usuario = u.id
  LEFT JOIN perfil p ON c.perfil  = p.id
`;

/**
 * Obtiene todos los conductores con sus datos de usuario y perfil asociados.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const [rows] = await db.query(BASE_QUERY);
  return rows;
};

/**
 * Busca un conductor específico por su ID único.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE c.id = ?`, [id]);
  return rows[0] || null;
};

/**
 * Verifica si un usuario ya tiene un perfil de conductor creado.
 * @param {number} usuarioId 
 * @returns {Promise<Object|null>}
 */
const findByUsuario = async (usuarioId) => {
  const [rows] = await db.query('SELECT * FROM conductor WHERE usuario = ?', [usuarioId]);
  return rows[0] || null;
};

/**
 * Crea un nuevo registro de conductor.
 * @param {Object} data - { usuario, perfil, discapacidad }
 * @returns {Promise<Object>} El registro del conductor creado con sus joins.
 */
const create = async ({ usuario, perfil, discapacidad }) => {
  const [result] = await db.query(
    'INSERT INTO conductor (usuario, perfil, discapacidad) VALUES (?, ?, ?)',
    [usuario, perfil || null, discapacidad ? 1 : 0]
  );
  return findById(result.insertId);
};

/**
 * Actualiza la información del perfil o estado de discapacidad del conductor.
 * @param {number} id 
 * @param {Object} data - { perfil, discapacidad }
 * @returns {Promise<Object>} El registro actualizado.
 */
const update = async (id, { perfil, discapacidad }) => {
  await db.query(
    'UPDATE conductor SET perfil = ?, discapacidad = ? WHERE id = ?',
    [perfil || null, discapacidad ? 1 : 0, id]
  );
  return findById(id);
};

/**
 * Elimina un registro de conductor de la base de datos.
 * @param {number} id 
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM conductor WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByUsuario, create, update, remove };