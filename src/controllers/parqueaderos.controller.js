/**
 * @module parqueaderosController
 * @description
 * Controller encargado de manejar las peticiones HTTP relacionadas con los parqueaderos.
 * Recibe las solicitudes del cliente, llama al Service correspondiente
 * y devuelve la respuesta HTTP.
 *
 * Flujo:
 * Cliente → Controller → Service → Repository → Datos
 */

const parqueaderoService = require('../services/parqueaderos.service');


/**
 * Crear un nuevo parqueadero
 *
 * Endpoint: POST /parqueaderos
 *
 * @function createParqueadero
 * @memberof module:parqueaderosController
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 *
 * @returns {Object} Parqueadero creado
 */
const createParqueadero = (req, res) => {
  try {
    const parqueadero = parqueaderoService.createParqueadero(req.body);
    res.status(201).json(parqueadero);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


/**
 * Obtener todos los parqueaderos
 *
 * Endpoint: GET /parqueaderos
 *
 * @function getParqueaderos
 * @memberof module:parqueaderosController
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 *
 * @returns {Array<Object>} Lista de parqueaderos
 */
const getParqueaderos = (req, res) => {
  const parqueaderos = parqueaderoService.getParqueaderos();
  res.json(parqueaderos);
};


/**
 * Obtener un parqueadero por su ID
 *
 * @function getParqueaderoById
 * @memberof module:parqueaderosController
 * @description
 * Controlador encargado de manejar la petición HTTP para obtener
 * un parqueadero específico según su identificador.
 *
 * Flujo:
 * Request → Controller → Service → Repository → Base de Datos
 *
 * @param {Object} req - Objeto de solicitud HTTP de Express
 * @param {Object} req.params - Parámetros de la ruta
 * @param {string} req.params.id - ID del parqueadero a buscar
 *
 * @param {Object} res - Objeto de respuesta HTTP de Express
 *
 * @returns {Object} 200 - Parqueadero encontrado
 * @returns {Object} 400 - Error en la solicitud
 */
const getParqueaderoById = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parqueadero = parqueaderoService.getParqueaderoById(id);
    res.json(parqueadero);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


/**
 * Editar un parqueadero existente
 *
 * Endpoint: PUT /parqueaderos/:id
 *
 * @function editParqueadero
 * @memberof module:parqueaderosController
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 *
 * @returns {Object} Parqueadero actualizado
 */
const editParqueadero = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    const updatedParqueadero = parqueaderoService.editParqueadero(id, data);

    res.json(updatedParqueadero);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


/**
 * Eliminar un parqueadero existente
 *
 * Endpoint: DELETE /parqueaderos/:id
 *
 * @function deleteParqueadero
 * @memberof module:parqueaderosController
 *
 * @param {Object} req - Request de Express
 * @param {Object} req.params - Parámetros de la ruta
 * @param {number} req.params.id - ID del parqueadero a eliminar
 *
 * @param {Object} res - Response de Express
 *
 * @returns {Object} Parqueadero eliminado
 */
const deleteParqueadero = (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const deletedParqueadero = parqueaderoService.deleteParqueaderoById(id);

    res.json(deletedParqueadero);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


module.exports = {
  createParqueadero,
  getParqueaderos,
  getParqueaderoById,
  editParqueadero,
  deleteParqueadero
};