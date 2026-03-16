/**
 * @module reportesController
 * @description
 * Controlador encargado de manejar las peticiones HTTP
 * relacionadas con los reportes del sistema.
 */

const reportesService = require("../services/reportesService");

/**
 * Genera un nuevo reporte en el sistema.
 *
 * @function generarReporte
 * @memberof module:reportesController
 * @param {Object} req - Objeto de solicitud HTTP de Express.
 * @param {Object} req.body - Datos enviados en el cuerpo de la solicitud.
 * @param {Object} res - Objeto de respuesta HTTP de Express.
 * @returns {Object} Respuesta JSON con el reporte generado.
 */
const generarReporte = (req, res) => {
  try {
    const reporteData = req.body;

    const nuevoReporte = reportesService.generarReporte(reporteData);

    res.status(201).json({
      message: "Reporte generado correctamente",
      data: nuevoReporte
    });

  } catch (error) {

    res.status(400).json({
      message: error.message
    });

  }
};


/**
 * Lista todos los reportes almacenados en el sistema.
 *
 * @function listarReportes
 * @memberof module:reportesController
 * @param {Object} req - Objeto de solicitud HTTP de Express.
 * @param {Object} res - Objeto de respuesta HTTP de Express.
 * @returns {Array<Object>} Lista de reportes.
 */
const listarReportes = (req, res) => {
  try {

    const reportes = reportesService.listarReportes();

    res.status(200).json(reportes);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


/**
 * Obtiene un reporte específico por su ID.
 *
 * @function obtenerReportePorId
 * @memberof module:reportesController
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} req.params - Parámetros de la URL.
 * @param {number} req.params.id - ID del reporte.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @returns {Object} Reporte encontrado.
 */
const obtenerReportePorId = (req, res) => {
  try {

    const { id } = req.params;

    const reporte = reportesService.obtenerReportePorId(Number(id));

    res.status(200).json(reporte);

  } catch (error) {

    res.status(404).json({
      message: error.message
    });

  }
};


/**
 * Actualiza la información de un reporte existente.
 *
 * @function editarReporte
 * @memberof module:reportesController
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} req.params - Parámetros de la URL.
 * @param {number} req.params.id - ID del reporte a actualizar.
 * @param {Object} req.body - Nuevos datos del reporte.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @returns {Object} Reporte actualizado.
 */
const editarReporte = (req, res) => {
  try {

    const { id } = req.params;
    const reporteData = req.body;

    const reporteActualizado = reportesService.editarReporte(Number(id), reporteData);

    res.status(200).json({
      message: "Reporte actualizado correctamente",
      data: reporteActualizado
    });

  } catch (error) {

    res.status(400).json({
      message: error.message
    });

  }
};


module.exports = {
  generarReporte,
  listarReportes,
  obtenerReportePorId,
  editarReporte
};