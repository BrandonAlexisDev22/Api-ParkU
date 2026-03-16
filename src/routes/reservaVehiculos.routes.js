const express = require('express');
const router = express.Router();
const reservaVehiculoController = require('../controllers/reservaVehiculoController');


/**
 * Ruta para listar todas las reservas
 * GET /reservas
 */
router.get('/', reservaVehiculoController.listarReservas);


/**
 * Ruta para generar reporte de reservas
 * GET /reservas/reporte
 */
router.get('/reporte', reservaVehiculoController.generarReporteReservas);


/**
 * Ruta para consultar una reserva por ID
 * GET /reservas/:id
 */
router.get('/:id', reservaVehiculoController.consultarReserva);


/**
 * Ruta para visualizar el detalle de una reserva
 * GET /reservas/ver/:id
 */
router.get('/ver/:id', reservaVehiculoController.visualizarReserva);


/**
 * Ruta para crear una nueva reserva
 * POST /reservas
 */
router.post('/', reservaVehiculoController.crearReserva);


/**
 * Ruta para editar una reserva existente
 * PUT /reservas/:id
 */
router.put('/:id', reservaVehiculoController.editarReserva);


module.exports = router;