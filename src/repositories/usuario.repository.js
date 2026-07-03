/**
 * @module UsuarioRepository
 * @description Capa de acceso a datos para la tabla 'usuario'.
 * Alineado con el modelo Usuario (nombre, correo, contrasena, numero, rol, estado, tipoDocumento, licencia, perfil).
 */

const db = require('../config/database');

/**
 * Consulta base para obtener todos los campos excepto contraseña (seguridad).
 * @constant {string}
 */
const BASE_QUERY = `
  SELECT u.id, u.nombre, u.correo, u.numero, u.rol, u.estado,
         u.tipoDocumento, u.licencia, u.perfil,
         r.nombre AS rol_nombre
  FROM usuario u
  LEFT JOIN rol r ON u.rol = r.id
`;

/**
 * Recupera todos los usuarios con detalles del rol.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const [rows] = await db.query(`${BASE_QUERY} ORDER BY u.nombre`);
  return rows;
};

/**
 * Busca un usuario por su ID.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE u.id = ?`, [id]);
  return rows[0] || null;
};

/**
 * Busca un usuario por correo (incluye contraseña para login).
 * @param {string} correo 
 * @returns {Promise<Object|null>}
 */
const findByCorreo = async (correo) => {
  const [rows] = await db.query('SELECT * FROM usuario WHERE correo = ?', [correo]);
  return rows[0] || null;
};

/**
 * Crea un nuevo usuario.
 * @param {Object} data - { nombre, correo, contrasena, numero, rol, estado?, tipoDocumento?, licencia?, perfil? }
 * @returns {Promise<Object>}
 */
const create = async ({ nombre, correo, contrasena, numero, rol, estado = true, tipoDocumento, licencia, perfil }) => {
  const [result] = await db.query(
    `INSERT INTO usuario 
     (nombre, correo, contrasena, numero, rol, estado, tipoDocumento, licencia, perfil) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nombre,
      correo,
      contrasena,
      numero || null,
      rol || null,
      estado ? 1 : 0,
      tipoDocumento || null,
      licencia || null,
      perfil || null
    ]
  );
  return findById(result.insertId);
};

/**
 * Actualiza parcialmente un usuario.
 * @param {number} id 
 * @param {Object} data - Campos a actualizar (todos opcionales)
 * @returns {Promise<Object>}
 */
const update = async (id, data) => {
  const fields = [];
  const values = [];
  const allowedFields = ['nombre', 'correo', 'numero', 'rol', 'estado', 'tipoDocumento', 'licencia', 'perfil'];
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`);
      // Convertir estado booleano a 0/1
      values.push(field === 'estado' ? (data[field] ? 1 : 0) : data[field]);
    }
  }
  if (fields.length === 0) {
    return findById(id);
  }
  values.push(id);
  const query = `UPDATE usuario SET ${fields.join(', ')} WHERE id = ?`;
  await db.query(query, values);
  return findById(id);
};

/**
 * Actualiza la contraseña de un usuario.
 * @param {number} id 
 * @param {string} contrasena - Hash de la nueva contraseña
 * @returns {Promise<void>}
 */
const updateContrasena = async (id, contrasena) => {
  await db.query('UPDATE usuario SET contrasena = ? WHERE id = ?', [contrasena, id]);
};

/**
 * Elimina un usuario.
 * @param {number} id 
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM usuario WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByCorreo, create, update, updateContrasena, remove };