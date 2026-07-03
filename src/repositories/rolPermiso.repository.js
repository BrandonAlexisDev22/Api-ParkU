/**
 * @module RolPermisoRepository
 * @description Capa de acceso a datos para la tabla intermedia 'rol_permiso'.
 * Gestiona la asignación y revocación de capacidades específicas a los roles del sistema.
 */

const db = require('../config/database');

/**
 * Consulta base con JOIN para obtener nombres de rol y permiso.
 * @constant {string}
 */
const BASE_QUERY = `
  SELECT rp.id, rp.rol, rp.permiso,
         r.nombre AS rol_nombre,
         p.nombre AS permiso_nombre
  FROM rol_permiso rp
  JOIN rol r     ON rp.rol     = r.id
  JOIN permiso p ON rp.permiso = p.id
`;

/**
 * Recupera todas las asociaciones con sus respectivos nombres.
 * @returns {Promise<Array>} Lista de objetos con detalle de Rol y Permiso.
 */
const findAll = async () => {
  const [rows] = await db.query(`${BASE_QUERY} ORDER BY r.nombre, p.nombre`);
  return rows;
};

/**
 * Busca una asociación por su ID primario.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE rp.id = ?`, [id]);
  return rows[0] || null;
};

/**
 * Obtiene todos los permisos asignados a un rol específico.
 * @param {number} rolId - ID del rol a consultar.
 * @returns {Promise<Array>}
 */
const findByRol = async (rolId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE rp.rol = ? ORDER BY p.nombre`,
    [rolId]
  );
  return rows;
};

/**
 * Busca una asociación específica por rol y permiso (para validar duplicados).
 * @param {number} rolId 
 * @param {number} permisoId 
 * @returns {Promise<Object|null>}
 */
const findByRolAndPermiso = async (rolId, permisoId) => {
  const [rows] = await db.query(
    'SELECT * FROM rol_permiso WHERE rol = ? AND permiso = ?',
    [rolId, permisoId]
  );
  return rows[0] || null;
};

/**
 * Crea una nueva vinculación entre un rol y un permiso.
 * @param {Object} data - { rol, permiso }
 * @param {number} data.rol - ID del rol.
 * @param {number} data.permiso - ID del permiso.
 * @returns {Promise<Object>} La asociación recién creada con nombres.
 */
const create = async ({ rol, permiso }) => {
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

module.exports = {
  findAll,
  findById,
  findByRol,
  findByRolAndPermiso,
  create,
  remove,
};