/**
 * @module VehiculosRoutes
 * @description Define las rutas HTTP para la gestión de vehículos.
 */

const express = require('express');
const router = express.Router();
const vehiculoController = require('../controllers/vehiculos.controller');

/**
 * Crear un nuevo vehículo
 * POST /vehiculos/create
 */
router.post('/create', vehiculoController.createVehiculo);

/**
 * Editar un vehículo por su ID
 * PUT /vehiculos/edit/:id_vehiculo
 */
router.put('/edit/:id_vehiculo', vehiculoController.editVehiculo);

/**
 * Eliminar un vehículo por su ID
 * DELETE /vehiculos/delete/:id_vehiculo
 */
router.delete('/delete/:id_vehiculo', vehiculoController.deleteVehiculo);

/**
 * Obtener todos los vehículos
 * GET /vehiculos/get
 */
router.get('/get', vehiculoController.getVehiculos);

module.exports = router;