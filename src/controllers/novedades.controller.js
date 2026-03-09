/**
 * @module incidentesController
 * @description
 * Controller encargado de manejar las peticiones HTTP
 * relacionadas con los incidentes o novedades del parqueadero.
 */

const incidenteService = require('../services/incidentes.service');

/**
 * Crear incidente
 */
const createIncidente = (req, res) => {

  try {

    const incidente = incidenteService.createIncidente(req.body);

    res.status(201).json(incidente);

  } catch (error) {

    res.status(400).json({ message: error.message });

  }
};

/**
 * Obtener todos los incidentes
 */
const getIncidentes = (req, res) => {

  const incidentes = incidenteService.getIncidentes();

  res.json(incidentes);
};

/**
 * Obtener incidente por ID
 */
const getIncidenteById = (req, res) => {

  try {

    const id = parseInt(req.params.id);

    const incidente = incidenteService.getIncidenteById(id);

    res.json(incidente);

  } catch (error) {

    res.status(400).json({ message: error.message });

  }
};

/**
 * Editar incidente
 */
const editIncidente = (req, res) => {

  try {

    const id = parseInt(req.params.id);

    const incidente = incidenteService.editIncidente(id, req.body);

    res.json(incidente);

  } catch (error) {

    res.status(400).json({ message: error.message });

  }
};

/**
 * Eliminar incidente
 */
const deleteIncidente = (req, res) => {

  try {

    const id = parseInt(req.params.id);

    const incidente = incidenteService.deleteIncidente(id);

    res.json(incidente);

  } catch (error) {

    res.status(400).json({ message: error.message });

  }
};

module.exports = {
  createIncidente,
  getIncidentes,
  getIncidenteById,
  editIncidente,
  deleteIncidente
};