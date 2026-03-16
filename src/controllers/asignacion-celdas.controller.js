const service = require('../services/asignacion-celdas.services');


/**
 * Obtener todas las asignaciones
 */
const getAsignaciones = async (req, res) => {
  try {
    const asignaciones = await service.getAsignaciones();
    res.json(asignaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Obtener asignación por ID
 */
const getAsignacionById = async (req, res) => {
  try {

    const { id } = req.params;

    const asignacion = await service.getAsignacionById(id);

    if (!asignacion) {
      return res.status(404).json({ message: "Asignación no encontrada" });
    }

    res.json(asignacion);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Crear asignación
 */
const createAsignacion = async (req, res) => {
  try {

    const nuevaAsignacion = await service.createAsignacionCelda(req.body);

    res.status(201).json(nuevaAsignacion);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


/**
 * Editar asignación
 */
const editAsignacion = async (req, res) => {
  try {

    const { id } = req.params;

    const asignacion = await service.editAsignacionCelda(id, req.body);

    res.json(asignacion);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


/**
 * Eliminar asignación
 */
const deleteAsignacion = async (req, res) => {
  try {

    const { id } = req.params;

    await service.deleteAsignacionById(id);

    res.json({ message: "Asignación eliminada correctamente" });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


module.exports = {
  getAsignaciones,
  getAsignacionById,
  createAsignacion,
  editAsignacion,
  deleteAsignacion
};