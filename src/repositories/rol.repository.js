/**
 * @module RolRepository
 * @description Capa de acceso a datos para la tabla 'rol'.
 * Incluye los permisos asociados a cada rol mediante JOIN con rol_permiso y permiso.
 */

const db = require('../config/database');

/**
 * Consulta base que incluye los permisos asociados.
 * @constant {string}
 */
const BASE_QUERY = `
  SELECT r.*,
         COALESCE(
           JSON_ARRAYAGG(
             JSON_OBJECT('id', p.id, 'nombre', p.nombre)
           ), '[]'
         ) AS permisos
  FROM rol r
  LEFT JOIN rol_permiso rp ON r.id = rp.rol_id
  LEFT JOIN permiso p ON rp.permiso_id = p.id
`;

/**
 * Recupera todos los roles con sus permisos asociados.
 * @returns {Promise<Array>} Lista de roles con sus permisos.
 */
const findAll = async () => {
  const [rows] = await db.query(`${BASE_QUERY} GROUP BY r.id ORDER BY r.nombre`);
  // Parsear el JSON de permisos (MySQL ya devuelve un string JSON)
  return rows.map(row => ({
    ...row,
    permisos: JSON.parse(row.permisos || '[]')
  }));
};

/**
 * Busca un rol por su ID, incluyendo sus permisos.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE r.id = ? GROUP BY r.id`, [id]);
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    ...row,
    permisos: JSON.parse(row.permisos || '[]')
  };
};

/**
 * Busca un rol por su nombre (sin permisos, para validaciones rápidas).
 * @param {string} nombre 
 * @returns {Promise<Object|null>}
 */
const findByNombre = async (nombre) => {
  const [rows] = await db.query('SELECT * FROM rol WHERE nombre = ?', [nombre]);
  return rows[0] || null;
};

/**
 * Crea un nuevo rol.
 * @param {Object} data - { nombre }
 * @param {string} data.nombre
 * @returns {Promise<Object>} El rol creado con sus permisos (vacío inicialmente).
 */
const create = async ({ nombre }) => {
  const [result] = await db.query('INSERT INTO rol (nombre) VALUES (?)', [nombre]);
  return findById(result.insertId);
};

/**
 * Actualiza parcialmente un rol existente.
 * @param {number} id 
 * @param {Object} data - { nombre } (opcional)
 * @returns {Promise<Object>} El rol actualizado con sus permisos.
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
  const query = `UPDATE rol SET ${fields.join(', ')} WHERE id = ?`;
  await db.query(query, values);
  return findById(id);
};

/**
 * Elimina un rol del sistema.
 * @param {number} id 
 * @returns {Promise<boolean>} True si se eliminó.
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM rol WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByNombre, create, update, remove };