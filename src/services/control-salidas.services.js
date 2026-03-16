/**
 * @module reportesService
 * @description
 * Service encargado de manejar la lógica de negocio
 * relacionada con los reportes del sistema.
 */

const reportesRepository = require("../repositories/asignacion-celdas.repository");


/**
 * Genera un nuevo reporte
 * 
 * @param {Object} reporteData
 * @returns {Object}
 */
const generarReporte = (reporteData) => {

    if(!reporteData){
        throw new Error("Los datos del reporte son obligatorios");
    }

    return reportesRepository.generarReporte(reporteData);
};


/**
 * Obtiene todos los reportes
 * 
 * @returns {Array<Object>}
 */
const getAll= () => {
    return reportesRepository.getAll();
};


/**
 * Obtiene un reporte por ID
 * 
 * @param {number} id
 * @returns {Object}
 */
const obtenerReportePorId = (id) => {

    const reporte = reportesRepository.consultarReporte(id);

    if(!reporte){
        throw new Error("Reporte no encontrado");
    }

    return reporte;
};


/**
 * Edita un reporte
 * 
 * @param {number} id
 * @param {Object} reporteData
 * @returns {Object}
 */
const editarReporte = (id, reporteData) => {

    const reporteActualizado = reportesRepository.editReporte(id, reporteData);

    if(!reporteActualizado){
        throw new Error("No se pudo actualizar el reporte");
    }

    return reporteActualizado;
};


module.exports = {
    generarReporte,
    getAll,
    obtenerReportePorId,
    editarReporte
};