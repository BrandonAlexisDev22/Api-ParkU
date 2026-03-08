/**
 * @module usuariosController
 * @description
 * Controller encargado de manejar las peticiones HTTP relacionadas con los usuarios.
 * Recibe las solicitudes del cliente, llama al Service correspondiente
 * y devuelve la respuesta HTTP.
 *
 * Flujo:
 * Cliente → Controller → Service → Repository → Datos
 */

const usuarioService = require('../services/usuarios.services');

/**
 * Crear un nuevo usuario
 *
 * Endpoint: POST /usuarios
 *
 * @function createUsuario
 * @memberof module:usuariosController
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 *
 * @returns {Object} Usuario creado
 */
const createUsuario = (req, res) => {
  try {
    const usuario = usuarioService.createUsuario(req.body);
    res.status(201).json(usuario);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Obtener todos los usuarios
 *
 * Endpoint: GET /usuarios
 *
 * @function getUsuarios
 * @memberof module:usuariosController
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 *
 * @returns {Array<Object>} Lista de usuarios
 */
const getUsuarios = (req, res) => {
  const usuarios = usuarioService.getUsuarios();
  res.json(usuarios);
};

/**
 * Editar un usuario existente
 *
 * Endpoint: PUT /usuarios/:id
 *
 * @function editUsuario
 * @memberof module:usuariosController
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 *
 * @returns {Object} Usuario actualizado
 */
const editUsuario = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updatedUsuario = usuarioService.editUsuario(id, data);
    res.json(updatedUsuario);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Eliminar un usuario existente
 *
 * Endpoint: DELETE /usuarios/:id
 *
 * @function deleteUsuario
 * @memberof module:usuariosController
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de la ruta
 * @param {number} req.params.id - ID del usuario a eliminar
 *
 * @param {Object} res - Response de Express
 *
 * @returns {Object} Usuario eliminado
 */
const deleteUsuario = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deletedUsuario = usuarioService.deleteUsuarioById(id);
    res.json(deletedUsuario);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createUsuario,
  getUsuarios,
  editUsuario,
  deleteUsuario
};