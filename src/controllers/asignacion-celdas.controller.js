const asignacionService = require('../services/asignacion-celdas.service');

/**
 * Crea una nueva asignación de celda.
 * Recibe los datos desde el body de la petición HTTP
 * y delega la lógica al service.
 *

 * @returns {void}
 */
const createAsignacion = (req, res) => {
  try {
    const asignacion = asignacionService.createAsignacionCelda(req.body);
    res.status(201).json(asignacion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Obtiene todas las asignaciones de celdas registradas.
 *

 * @returns {void}
 */
const getAsignaciones = (req, res) => {
  const asignaciones = asignacionService.getAsignaciones();
  res.json(asignaciones);
};

/**
 * Obtiene una asignación específica por su ID.
 *
P.
 * @returns {void}
 */
const getAsignacionById = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const asignacion = asignacionService.getAsignacionById(id);
    res.json(asignacion);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

/**
 * Actualiza una asignación de celda existente.
 *

 * @returns {void}
 */
const editAsignacion = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = asignacionService.editAsignacionCelda(id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Elimina una asignación de celda por su ID.
 *

 * @returns {void}
 */
const deleteAsignacion = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = asignacionService.deleteAsignacionById(id);
    res.json(deleted);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createAsignacion,
  getAsignaciones,
  getAsignacionById,
  editAsignacion,
  deleteAsignacion
};