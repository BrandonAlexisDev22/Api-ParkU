// Arreglo que simula una base de datos en memoria
let permisos = [];

// Contador para generar IDs automáticamente
let idCounter = 1;

/**
 * Obtiene todos los permisos almacenados
 *
 * @function getAll
 * @memberof module:permisosRepository
 * @returns {Array<Object>} Lista de permisos
 */
const getAll = () => permisos;

/**
 * Busca un permiso por su ID
 *
 * @function getById
 * @memberof module:permisosRepository
 * @param {number} id - Identificador del permiso
 * @returns {Object|undefined} Permiso encontrado o undefined si no existe
 */
const getById = (id) => permisos.find(p => p.id_permiso === id);

/**
 * Busca un permiso por su nombre
 *
 * @function getByName
 * @memberof module:permisosRepository
 * @param {string} name - Nombre del permiso
 * @returns {Object|undefined} Permiso encontrado o undefined si no existe
 */
const getByName = (name) => permisos.find(p => p.nombre_permiso === name);

/**
 * Crea un nuevo permiso
 *
 * Genera automáticamente un ID y guarda el permiso en memoria.
 *
 * @function create
 * @memberof module:permisosRepository
 *
 * @param {Object} permisoData - Datos del permiso
 * @param {string} permisoData.nombre_permiso - Nombre del permiso
 * @param {boolean} permisoData.estado - Estado del permiso
 *
 * @returns {Object} Permiso creado
 */
const create = (permisoData) => {
  const newPermiso = { id_permiso: idCounter++, ...permisoData };
  permisos.push(newPermiso);
  return newPermiso;
};

/**
 * Edita un permiso existente por su ID
 *
 * Busca un permiso en la lista y actualiza sus datos.
 *
 * @function editById
 * @memberof module:permisosRepository
 *
 * @param {number} id - ID del permiso a editar
 * @param {Object} permisoData - Nuevos datos del permiso
 *
 * @returns {Object|null} Permiso actualizado o null si no se encuentra
 */
const editById = (id, permisoData) => {
  const permiso = permisos.find(p => p.id_permiso === id);
  if (!permiso) {
    return null;
  }
  Object.assign(permiso, permisoData);
  return permiso;
};

/**
 * Elimina un permiso por su ID
 *
 * @function deleteById
 * @memberof module:permisosRepository
 *
 * @param {number} id - ID del permiso a eliminar
 * @returns {Object|null} Permiso eliminado o null si no existe
 */
const deleteById = (id) => {
  const index = permisos.findIndex(p => p.id_permiso === id);
  if (index === -1) {
    return null;
  }
  const deletedPermiso = permisos.splice(index, 1)[0];
  return deletedPermiso;
};

module.exports = {
  getAll,
  getById,
  getByName,
  create,
  editById,
  deleteById
};


