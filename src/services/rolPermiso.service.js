/**
 * @module RolPermisoService
 * @description Gestión de la relación entre roles y permisos. 
 * Permite asignar o revocar capacidades específicas a los roles del sistema.
 */

const repo     = require('../repositories/rolPermiso.repository');
const rolRepo  = require('../repositories/rol.repository');
const permRepo = require('../repositories/permiso.repository');

/**
 * @swagger
 * components:
 * schemas:
 * RolPermiso:
 * type: object
 * required:
 * - rol
 * - permiso
 * properties:
 * id:
 * type: integer
 * description: ID único de la asignación.
 * rol:
 * type: integer
 * description: ID del rol al que se le asigna el permiso.
 * permiso:
 * type: integer
 * description: ID del permiso que se otorga al rol.
 * example:
 * id: 1
 * rol: 2
 * permiso: 5
 */

/**
 * Obtiene todas las asignaciones de roles y permisos del sistema.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Obtiene todos los permisos asociados a un rol específico.
 * @param {number} rolId - ID del rol a consultar.
 * @returns {Promise<Array>}
 */
const getByRol = (rolId) => repo.findByRol(rolId);

/**
 * Asigna un permiso a un rol validando la existencia de ambos.
 * @param {number} rol - ID del rol.
 * @param {number} permiso - ID del permiso.
 * @throws {Object} 400 si faltan datos, 404 si el rol o permiso no existen.
 */
const create = async (rol, permiso) => {
  if (!rol || !permiso) throw { status: 400, message: 'rol y permiso son requeridos' };
  
  const rolExiste  = await rolRepo.findById(rol);
  if (!rolExiste)  throw { status: 404, message: 'Rol no encontrado' };
  
  const permExiste = await permRepo.findById(permiso);
  if (!permExiste) throw { status: 404, message: 'Permiso no encontrado' };
  
  return repo.create(rol, permiso);
};

/**
 * Revoca un permiso de un rol (elimina la asignación).
 * @param {number} id - ID del registro en la tabla intermedia.
 * @throws {Object} 404 si el registro no existe.
 */
const remove = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Registro no encontrado' };
  return repo.remove(id);
};

module.exports = { getAll, getByRol, create, remove };