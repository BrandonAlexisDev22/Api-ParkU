/**
 * @module reconocimientoRoutes
 * @description
 * Define las rutas HTTP del módulo
 * de reconocimiento de placas.
 */

const express = require('express');
const router = express.Router();

const reconocimientoController =
  require('../controllers/reconocimiento.controller');

/**
 * Registrar reconocimiento
 */
router.post('/create', reconocimientoController.createReconocimiento);

/**
 * Obtener todos
 */
router.get('/get', reconocimientoController.getReconocimientos);

/**
 * Obtener por ID
 */
router.get('/get/:id', reconocimientoController.getReconocimientoById);

/**
 * Eliminar registro
 */
router.delete('/delete/:id', reconocimientoController.deleteReconocimiento);

module.exports = router;