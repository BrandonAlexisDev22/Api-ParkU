/**
 * @module reportesRoutes
 * @description
 * Define las rutas HTTP relacionadas con los reportes del sistema.
 */

const express = require("express");
const router = express.Router();

const reportesController = require("../controllers/reportesController");


/**
 * Ruta para generar un nuevo reporte
 *
 * @name GenerarReporte
 * @route {POST} /reportes
 * @memberof module:reportesRoutes
 * @param {Object} req.body - Datos del reporte
 * @param {number} req.body.total_vehiculos_ingresados
 * @param {number} req.body.total_vehiculos_salidos
 * @param {number} req.body.celdas_ocupadas
 * @param {number} req.body.celdas_disponibles
 * @param {string} req.body.fecha_reporte
 * @returns {Object} Reporte generado
 */
router.post("/reportes", reportesController.generarReporte);


/**
 * Ruta para listar todos los reportes
 *
 * @name ListarReportes
 * @route {GET} /reportes
 * @memberof module:reportesRoutes
 * @returns {Array<Object>} Lista de reportes
 */
router.get("/reportes", reportesController.listarReportes);


/**
 * Ruta para obtener un reporte por ID
 *
 * @name ObtenerReportePorId
 * @route {GET} /reportes/:id
 * @memberof module:reportesRoutes
 * @param {number} req.params.id - ID del reporte
 * @returns {Object} Reporte encontrado
 */
router.get("/reportes/:id", reportesController.obtenerReportePorId);


/**
 * Ruta para actualizar un reporte
 *
 * @name EditarReporte
 * @route {PUT} /reportes/:id
 * @memberof module:reportesRoutes
 * @param {number} req.params.id - ID del reporte
 * @param {Object} req.body - Datos nuevos del reporte
 * @returns {Object} Reporte actualizado
 */
router.put("/reportes/:id", reportesController.editarReporte);


module.exports = router;