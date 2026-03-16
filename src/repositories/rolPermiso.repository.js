/**
 * @module RolPermisoRepository
 * @description Capa de acceso a datos para la tabla intermedia 'rol_permiso'.
 * Gestiona la asignación y revocación de capacidades específicas a los roles del sistema.
 */

const db = require('../config/database');

/**
 * Recupera todas las asociaciones de la tabla pivot con sus respectivos nombres.
 * @returns {Promise<Array>} Lista de objetos con detalle de Rol y Permiso.
 */
const findAll = async () => {
  const [rows] = await db.query(`
    SELECT rp.id, r.id AS rol_id, r.nombre AS rol_nombre,
           p.id AS permiso_id, p.nombre AS permiso_nombre
    FROM rol_permiso rp
    JOIN rol r     ON rp.rol     = r.id
    JOIN permiso p ON rp.permiso = p.id
  `);
  return rows;
};

/**
 * Obtiene todos los permisos asignados a un rol específico.
 * Útil para la reconstrucción de permisos en el lado del cliente (auth context).
 * @param {number} rolId - ID del rol a consultar.
 * @returns {Promise<Array>}
 */
const findByRol = async (rolId) => {
  const [rows] = await db.query(`
    SELECT rp.id, p.id AS permiso_id, p.nombre AS permiso_nombre
    FROM rol_permiso rp
    JOIN permiso p ON rp.permiso = p.id
    WHERE rp.rol = ?
  `, [rolId]);
  return rows;
};

/**
 * Busca una asociación específica por su ID primario.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM rol_permiso WHERE id = ?', [id]);
  return rows[0] || null;
};

/**
 * Crea una nueva vinculación entre un rol y un permiso.
 * @param {number} rol - ID del rol.
 * @param {number} permiso - ID del permiso.
 * @returns {Promise<Object>} La asociación recién creada.
 */
const create = async (rol, permiso) => {
  const [result] = await db.query(
    'INSERT INTO rol_permiso (rol, permiso) VALUES (?, ?)',
    [rol, permiso]
  );
  return findById(result.insertId);
};

/**
 * Revoca un permiso de un rol (Elimina la entrada en la tabla intermedia).
 * @param {number} id - ID de la relación a eliminar.
 * @returns {Promise<boolean>} True si la operación afectó alguna fila.
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM rol_permiso WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findByRol, findById, create, remove };