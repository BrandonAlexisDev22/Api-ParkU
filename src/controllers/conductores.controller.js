/**
 * @module ConductorController
 * @description Controlador encargado de manejar las peticiones HTTP
 * relacionadas con los conductores.
 */

const conductorService = require('../services/conductores.services');

/**
 * Crea un nuevo conductor.
 *
 * @function createConductor
 * @returns {void}
 */
const createConductor = (req, res) => {
  try {
    const conductor = conductorService.createConductor(req.body);
    res.status(201).json(conductor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Obtiene todos los conductores registrados.
 *
 * @function getConductores
 * @returns {void}
 */
const getConductores = (req, res) => {
  const conductores = conductorService.getConductores();
  res.json(conductores);
};

/**
 * Actualiza un conductor existente.
 *
 * @function editConductor
 * @returns {void}
 */
const editConductor = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    const updatedConductor = conductorService.editConductor(id, data);

    res.json(updatedConductor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Elimina un conductor por su ID.
 *
 * @function deleteConductor
 * @returns {void}
 */
const deleteConductor = (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const deletedConductor = conductorService.deleteConductorById(id);

    res.json(deletedConductor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createConductor,
  getConductores,
  editConductor,
  deleteConductor
};