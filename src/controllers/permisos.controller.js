/**
 * @module permisosController
 * @description
 * Controller encargado de manejar las peticiones HTTP relacionadas con los permisos.
 * Recibe las solicitudes del cliente, llama al Service correspondiente
 * y devuelve la respuesta HTTP.
 *
 * Flujo:
 * Cliente → Controller → Service → Repository → Datos
 */

const permisoService = require('../services/permisos.services');

/**
 * Crear un nuevo rol
 *
 * Endpoint: POST /roles
 *
 * @function createPermiso
 * @memberof module:permisoController
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 *
 * @returns {Object} Permiso creado
 */
const createPermiso = (req, res) => {
  try {
    const permiso = permisoService.createPermiso(req.body);
    res.status(201).json(permiso);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Obtener todos los permisos
 *
 * Endpoint: GET /permisos
 *
 * @function getPermisos
 * @memberof module:permisosController
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 *
 * @returns {Array<Object>} Lista de roles
 */
const getPermisos = (req, res) => {
  const permisos = permisoService.getPermisos();
  res.json(permisos);
};

/**
 * Obtener un permiso por su ID
 *
 * @function getPermisosById
 * @memberof module:permisosController
 * @description
 * Controlador encargado de manejar la petición HTTP para obtener
 * un permiso específico según su identificador.
 *
 * Flujo:
 * Request → Controller → Service → Repository → Base de Datos
 *
 * @param {Object} req - Objeto de solicitud HTTP de Express
 * @param {Object} req.params - Parámetros de la ruta
 * @param {string} req.params.id - ID del permiso a buscar
 *
 * @param {Object} res - Objeto de respuesta HTTP de Express
 *
 * @returns {Object} 200 - Permiso encontrado
 * @returns {Object} 400 - Error en la solicitud
 */
const getPermisosById = (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const permiso = permisoService.getPermisosById(id);
        res.json(permiso);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
/**
 * Editar un permiso existente
 *
 * Endpoint: PUT /permisos/:id
 *
 * @function editPermiso
 * @memberof module:permisosController
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 *
 * @returns {Object} Permiso actualizado
 */
const editPermiso = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    const updatedPermiso = permisoService.editPermiso(id, data);

    res.json(updatedPermiso);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


/**
 * Eliminar un permiso existente
 *
 * Endpoint: DELETE /permisos/:id
 *
 * @function deletePermiso
 * @memberof module:permisosController
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de la ruta
 * @param {number} req.params.id - ID del permiso a eliminar
 *
 * @param {Object} res - Response de Express
 *
 * @returns {Object} Permiso eliminado
 */
const deletePermiso = (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const deletedPermiso = permisoService.deletePermisoById(id);

    res.json(deletedPermiso);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


module.exports = {
  createPermiso,
  getPermisos,
  getPermisosById,
  editPermiso,
  deletePermiso
};