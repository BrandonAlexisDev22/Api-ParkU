const express = require('express');
const router = express.Router();

const asignacionController = require('../controllers/asignacion-celdas.controller');

/**
 * Crear una asignación de celda
 */
router.post('/', asignacionController.createAsignacion);

/**
 * Obtener todas las asignaciones
 */
router.get('/', asignacionController.getAsignaciones);

/**
 * Obtener una asignación por ID
 */
router.get('/:id', asignacionController.getAsignacionById);

/**
 * Editar una asignación
 */
router.put('/:id', asignacionController.editAsignacion);

/**
 * Eliminar una asignación
 */
router.delete('/:id', asignacionController.deleteAsignacion);

module.exports = router;