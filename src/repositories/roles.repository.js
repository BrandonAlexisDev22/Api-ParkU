/**
 * @module rolesRepository
 * @description
 * Repository encargado de gestionar el acceso a los datos de los roles.
 * En este caso los datos se almacenan en memoria usando un arreglo.
 *
 * En una aplicación real, esta capa se conectaría a una base de datos.
 */

// Arreglo que simula una base de datos en memoria
let roles = [];

// Contador para generar IDs automáticamente
let idCounter = 1;

/**
 * Obtiene todos los roles almacenados
 *
 * @function getAll
 * @memberof module:rolesRepository
 * @returns {Array<Object>} Lista de roles
 */
const getAll = () => roles;

/**
 * Busca un rol por su ID
 *
 * @function getById
 * @memberof module:rolesRepository
 * @param {number} id - Identificador del rol
 * @returns {Object|undefined} Rol encontrado o undefined si no existe
 */
const getById = (id) => roles.find(r => r.id_rol === id);

/**
 * Busca un rol por su nombre
 *
 * @function getByName
 * @memberof module:rolesRepository
 * @param {string} name - Nombre del rol
 * @returns {Object|undefined} Rol encontrado o undefined si no existe
 */
const getByName = (name) => roles.find(r => r.nombre_rol === name);

/**
 * Crea un nuevo rol
 *
 * Genera automáticamente un ID y guarda el rol en memoria.
 *
 * @function create
 * @memberof module:rolesRepository
 * @param {Object} roleData - Datos del rol
 * @param {string} roleData.nombre_rol - Nombre del rol
 * @returns {Object} Rol creado
 */
const create = (roleData) => {
  const newRole = { id_rol: idCounter++, ...roleData };
  roles.push(newRole);
  return newRole;
};


/**
 * Edita un rol existente por su ID
 *
 * Busca un rol en la lista y actualiza sus datos.
 *
 * @function editById
 * @memberof module:rolesRepository
 *
 * @param {number} id - ID del rol a editar
 * @param {Object} roleData - Datos nuevos del rol
 * @param {string} roleData.nombre_rol - Nuevo nombre del rol
 *
 * @returns {Object|null} Rol actualizado o null si no se encuentra
 */
const editById = (id, roleData) => {
  const role = roles.find(r => r.id_rol === id);
  if (!role) {
    return null;
  }
  Object.assign(role, roleData);
  return role;
};


/**
 * Elimina un rol por su ID
 *
 * @param {number} id - ID del rol a eliminar
 * @returns {Object|null} Rol eliminado o null si no existe
 */
const deleteById = (id) => {
  const index = roles.findIndex(r => r.id_rol === id);
  if (index === -1) {
    return null;
  }
  const deletedRole = roles.splice(index, 1)[0];
  return deletedRole;
};



module.exports = {
  getAll,
  getById,
  getByName,
  create,
  editById,
  deleteById
};