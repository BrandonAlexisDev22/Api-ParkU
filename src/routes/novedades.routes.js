/**
 * @module incidentesRoutes
 * @description
 * Define las rutas HTTP para la gestión de incidentes
 */

const express = require('express');
const router = express.Router();

const incidenteController = require('../controllers/incidentes.controller');

/**
 * Crear incidente
 */
router.post('/create', incidenteController.createIncidente);

/**
 * Editar incidente
 */
router.put('/edit/:id', incidenteController.editIncidente);

/**
 * Eliminar incidente
 */
router.delete('/delete/:id', incidenteController.deleteIncidente);

/**
 * Obtener todos
 */
router.get('/get', incidenteController.getIncidentes);

/**
 * Obtener por ID
 */
router.get('/get/:id', incidenteController.getIncidenteById);

module.exports = router;