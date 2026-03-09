/**
 * @module celdasController
 * @description
 * Controller encargado de manejar las peticiones HTTP relacionadas con las celdas.
 *
 * Flujo:
 * Cliente → Controller → Service → Repository → Datos
 */

const celdaService = require('../services/celdas.service');

/**
 * Crear una nueva celda
 *
 * Endpoint: POST /celdas
 *
 * @function createCelda
 * @memberof module:celdasController
 */
const createCelda = (req, res) => {

  try {

    const celda = celdaService.createCelda(req.body);

    res.status(201).json(celda);

  } catch (error) {

    res.status(400).json({ message: error.message });

  }
};

/**
 * Obtener todas las celdas
 *
 * Endpoint: GET /celdas
 *
 * @function getCeldas
 * @memberof module:celdasController
 */
const getCeldas = (req, res) => {

  const celdas = celdaService.getCeldas();

  res.json(celdas);

};

/**
 * Obtener una celda por ID
 *
 * Endpoint: GET /celdas/:id
 *
 * @function getCeldaById
 * @memberof module:celdasController
 */
const getCeldaById = (req, res) => {

  try {

    const id = parseInt(req.params.id);

    const celda = celdaService.getCeldaById(id);

    res.json(celda);

  } catch (error) {

    res.status(400).json({ message: error.message });

  }

};

/**
 * Editar una celda
 *
 * Endpoint: PUT /celdas/:id
 *
 * @function editCelda
 * @memberof module:celdasController
 */
const editCelda = (req, res) => {

  try {

    const id = parseInt(req.params.id);

    const updated = celdaService.editCelda(id, req.body);

    res.json(updated);

  } catch (error) {

    res.status(400).json({ message: error.message });

  }

};

/**
 * Eliminar una celda
 *
 * Endpoint: DELETE /celdas/:id
 *
 * @function deleteCelda
 * @memberof module:celdasController
 */
const deleteCelda = (req, res) => {

  try {

    const id = parseInt(req.params.id);

    const deleted = celdaService.deleteCeldaById(id);

    res.json(deleted);

  } catch (error) {

    res.status(400).json({ message: error.message });

  }

};

module.exports = {
  createCelda,
  getCeldas,
  getCeldaById,
  editCelda,
  deleteCelda
};