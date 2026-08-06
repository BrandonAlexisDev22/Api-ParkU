/**
 * @module RolPermisoRepository
 * @description Capa de acceso a datos para la tabla intermedia 'rol_permiso' usando Sequelize.
 * Gestiona la asignación y revocación de capacidades específicas a los roles del sistema.
 */

const { RolPermiso, Rol, Permiso } = require('../models');

const includeRelaciones = [
  { model: Rol, as: 'Rol', attributes: ['nombre'] },
  { model: Permiso, as: 'Permiso', attributes: ['nombre'] },
];

/**
 * Aplana el resultado de Sequelize manteniendo el shape que tenía la versión
 * anterior con SQL manual: { id, rol, permiso, rol_nombre, permiso_nombre }.
 * @param {import('sequelize').Model} instancia
 * @returns {Object|null}
 */
const mapRolPermiso = (instancia) => {
  if (!instancia) return null;
  const plano = instancia.toJSON();
  return {
    id: plano.id,
    rol: plano.rol_id,
    permiso: plano.permiso_id,
    rol_nombre: plano.Rol ? plano.Rol.nombre : null,
    permiso_nombre: plano.Permiso ? plano.Permiso.nombre : null,
  };
};

/**
 * Recupera todas las asociaciones con sus respectivos nombres.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const rows = await RolPermiso.findAll({
    include: includeRelaciones,
    order: [[{ model: Rol, as: 'Rol' }, 'nombre', 'ASC'], [{ model: Permiso, as: 'Permiso' }, 'nombre', 'ASC']],
  });
  return rows.map(mapRolPermiso);
};

/**
 * Busca una asociación por su ID primario.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const row = await RolPermiso.findByPk(id, { include: includeRelaciones });
  return mapRolPermiso(row);
};

/**
 * Obtiene todos los permisos asignados a un rol específico.
 * @param {number} rolId - ID del rol a consultar.
 * @returns {Promise<Array>}
 */
const findByRol = async (rolId) => {
  const rows = await RolPermiso.findAll({
    where: { rol_id: rolId },
    include: includeRelaciones,
    order: [[{ model: Permiso, as: 'Permiso' }, 'nombre', 'ASC']],
  });
  return rows.map(mapRolPermiso);
};

/**
 * Busca una asociación específica por rol y permiso (para validar duplicados).
 * @param {number} rolId
 * @param {number} permisoId
 * @returns {Promise<Object|null>}
 */
const findByRolAndPermiso = async (rolId, permisoId) => {
  const row = await RolPermiso.findOne({ where: { rol_id: rolId, permiso_id: permisoId } });
  return row ? row.toJSON() : null;
};

/**
 * Crea una nueva vinculación entre un rol y un permiso.
 * @param {Object} data - { rol, permiso }
 * @param {number} data.rol - ID del rol.
 * @param {number} data.permiso - ID del permiso.
 * @returns {Promise<Object>} La asociación recién creada con nombres.
 */
const create = async ({ rol, permiso }) => {
  const nuevo = await RolPermiso.create({ rol_id: rol, permiso_id: permiso });
  return findById(nuevo.id);
};

/**
 * Revoca un permiso de un rol (Elimina la entrada en la tabla intermedia).
 * @param {number} id - ID de la relación a eliminar.
 * @returns {Promise<boolean>} True si la operación afectó alguna fila.
 */
const remove = async (id) => {
  const filasEliminadas = await RolPermiso.destroy({ where: { id } });
  return filasEliminadas > 0;
};

module.exports = {
  findAll,
  findById,
  findByRol,
  findByRolAndPermiso,
  create,
  remove,
};
