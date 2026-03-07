/**
 * @module rolesService
 * @description
 * Service encargado de manejar la lógica de negocio de los roles
 * dentro de la arquitectura MVC.
 *
 * Responsabilidades:
 * - Aplicar reglas de negocio
 * - Validar datos antes de enviarlos al repositorio
 * - Comunicarse con el Repository para acceder a la base de datos
 *
 * Flujo:
 * Controller → Service → Repository → Base de Datos
 */

// Importa el repository encargado del acceso a datos
const roleRepository = require('../repositories/roles.repository');

/**
 * Crear un nuevo rol
 *
 * Regla de negocio:
 * No se puede crear un rol con un nombre que ya exista.
 *
 * @function createRole
 * @memberof module:rolesService
 *
 * @param {Object} data - Datos del rol a crear
 * @param {string} data.nombre_rol - Nombre del rol
 * @returns {Object} Rol creado
 * @throws {Error} Si el rol ya existe
 */
const createRole = (data) => {

  const existing = roleRepository.getByName(data.nombre_rol);

  if (existing) {
    throw new Error('El rol ya existe');
  }

  return roleRepository.create(data);
};

/**
 * Obtener todos los roles
 *
 * @function getRoles
 * @memberof module:rolesService
 *
 * @returns {Array<Object>} Lista de roles
 */
const getRoles = () => roleRepository.getAll();


/**
 * Editar un rol existente
 *
 * Regla de negocio:
 * - El rol debe existir
 * - El nombre del rol no puede duplicarse
 *
 * @function editRole
 * @memberof module:rolesService
 *
 * @param {number} id - ID del rol a editar
 * @param {Object} data - Nuevos datos del rol
 * @param {string} data.nombre_rol - Nuevo nombre del rol
 *
 * @returns {Object} Rol actualizado
 * @throws {Error} Si el rol no existe
 * @throws {Error} Si el nombre del rol ya existe
 */
const editRole = (id, data) => {
  const roleExisting = roleRepository.getById(id);
  if (!roleExisting) {
    throw new Error("El rol no existe");
  }
  const duplicateRole = roleRepository.getByName(data.nombre_rol);
  if (duplicateRole && duplicateRole.id_rol !== id) {
    throw new Error("Ya existe un rol con ese nombre");
  }
  return roleRepository.editById(id, data);
};

/**
 * Eliminar un rol por su ID
 *
 * Regla de negocio:
 * - El rol debe existir antes de eliminarse
 *
 * @function deleteRoleById
 * @memberof module:rolesService
 *
 * @param {number} id - ID del rol a eliminar
 * @returns {Object} Rol eliminado
 * @throws {Error} Si el rol no existe
 */

const deleteRoleById = (id) => {
  const roleExisting = roleRepository.getById(id);
  if (!roleExisting) {
    throw new Error("El rol no existe");
  }
  return roleRepository.deleteById(id);
};

module.exports = {
  createRole,
  getRoles,
  editRole,
  deleteRoleById
};