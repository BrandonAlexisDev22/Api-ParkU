/**
 * @module UsuarioRepository
 * @description Capa de acceso a datos para la tabla 'usuario'.
 * Gestiona cuentas de acceso, perfiles de usuario y credenciales de seguridad.
 */

const db = require('../config/database');

/**
 * Recupera todos los usuarios con el detalle de su rol asociado.
 * Excluye la contraseña por seguridad en listados generales.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const [rows] = await db.query(`
    SELECT u.id, u.correo, u.nombre, u.numero,
           r.id AS rol_id, r.nombre AS rol_nombre
    FROM usuario u
    LEFT JOIN rol r ON u.rol = r.id
  `);
  return rows;
};

/**
 * Busca un usuario por su ID. Incluye detalles del rol.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query(`
    SELECT u.id, u.correo, u.nombre, u.numero,
           r.id AS rol_id, r.nombre AS rol_nombre
    FROM usuario u
    LEFT JOIN rol r ON u.rol = r.id
    WHERE u.id = ?
  `, [id]);
  return rows[0] || null;
};

/**
 * Busca un usuario por su correo electrónico.
 * IMPORTANTE: Este método retorna el hash de la contraseña para procesos de Login.
 * @param {string} correo 
 * @returns {Promise<Object|null>} Fila completa del usuario.
 */
const findByCorreo = async (correo) => {
  const [rows] = await db.query('SELECT * FROM usuario WHERE correo = ?', [correo]);
  return rows[0] || null;
};

/**
 * Registra un nuevo usuario en la plataforma.
 * @param {Object} data - { correo, contrasena (hash), nombre, numero, rol }
 * @returns {Promise<Object>} El usuario creado (sin contraseña).
 */
const create = async ({ correo, contrasena, nombre, numero, rol }) => {
  const [result] = await db.query(
    'INSERT INTO usuario (correo, contrasena, nombre, numero, rol) VALUES (?, ?, ?, ?, ?)',
    [correo, contrasena, nombre, numero || null, rol || null]
  );
  return findById(result.insertId);
};

/**
 * Actualiza la información de perfil del usuario.
 * @param {number} id 
 * @param {Object} data - { nombre, numero, rol }
 * @returns {Promise<Object>}
 */
const update = async (id, { nombre, numero, rol }) => {
  await db.query(
    'UPDATE usuario SET nombre = ?, numero = ?, rol = ? WHERE id = ?',
    [nombre, numero || null, rol || null, id]
  );
  return findById(id);
};

/**
 * Sobrescribe la contraseña actual por un nuevo hash cifrado.
 * @param {number} id 
 * @param {string} contrasena - Nuevo hash generado.
 * @returns {Promise<void>}
 */
const updateContrasena = async (id, contrasena) => {
  await db.query('UPDATE usuario SET contrasena = ? WHERE id = ?', [contrasena, id]);
};

/**
 * Elimina una cuenta de usuario.
 * @param {number} id 
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM usuario WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByCorreo, create, update, updateContrasena, remove };