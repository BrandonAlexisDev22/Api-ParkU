/**
 * @module rolesController
 * @description
 * Controller encargado de manejar las peticiones HTTP relacionadas con los roles.
 * Recibe las solicitudes del cliente, llama al Service correspondiente
 * y devuelve la respuesta HTTP.
 *
 * Flujo:
 * Cliente → Controller → Service → Repository → Datos
 */

const roleService = require('../services/role.services');

/**
 * Crear un nuevo rol
 *
 * Endpoint: POST /roles
 *
 * @function createRole
 * @memberof module:rolesController
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 *
 * @returns {Object} Rol creado
 */
const createRole = (req, res) => {
  try {
    const role = roleService.createRole(req.body);
    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Obtener todos los roles
 *
 * Endpoint: GET /roles
 *
 * @function getRoles
 * @memberof module:rolesController
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 *
 * @returns {Array<Object>} Lista de roles
 */
const getRoles = (req, res) => {
  const roles = roleService.getRoles();
  res.json(roles);
};

/**
 * Editar un rol existente
 *
 * Endpoint: PUT /roles/:id
 *
 * @function editRole
 * @memberof module:rolesController
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 *
 * @returns {Object} Rol actualizado
 */
const editRole = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updatedRole = roleService.editRole(id, data);
    res.json(updatedRole);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Eliminar un rol existente
 *
 * Endpoint: DELETE /roles/:id
 *
 * @function deleteRole
 * @memberof module:rolesController
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de la ruta
 * @param {number} req.params.id - ID del rol a eliminar
 *
 * @param {Object} res - Response de Express
 *
 * @returns {Object} Rol eliminado
 */
const deleteRole = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deletedRole = roleService.deleteRoleById(id);
    res.json(deletedRole);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createRole,
  getRoles,
  editRole,
  deleteRole
};