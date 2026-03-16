/**
 * @module reportesRepository
 * @description
 * Repository encargado de gestionar los reportes del sistema.
 * Los datos se almacenan en memoria usando un arreglo.
 */

let reportes = [];
let idCounter = 1;

/**
 * Obtiene todos los roles almacenados
 *
 * @function getAll
 * @memberof module:control-salidasRepository
 * @returns {Array<Object>} Lista de control
 */
const getAll = () => reportes;

/**
 * Genera un nuevo reporte
 *
 * @function generarReporte
 * @memberof module:reportesRepository
 * @param {Object} reporteData - Datos del reporte
 * @param {number} reporteData.total_vehiculos_ingresados
 * @param {number} reporteData.total_vehiculos_salidos
 * @param {number} reporteData.celdas_ocupadas
 * @param {number} reporteData.celdas_disponibles
 * @param {string} reporteData.fecha_reporte
 *
 * @returns {Object} Reporte generado
 */
const generarReporte = (reporteData) => {
  const newReporte = { id_control_salida: idCounter++, ...reporteData };
  reportes.push(newReporte);
  return newReporte;
};




/**
 * Consulta un reporte por su ID
 *
 * @function consultarReporte
 * @memberof module:reportesRepository
 * @param {number} id - ID del reporte
 * @returns {Object|undefined} Reporte encontrado o undefined si no existe
 */
const consultarReporte = (id) => reportes.find(r => r.id_control_salida === id);


/**
 * Edita un reporte existente
 *
 * @function editarReporte
 * @memberof module:reportesRepository
 * @param {number} id - ID del reporte
 * @param {Object} reporteData - Datos nuevos del reporte
 * @returns {Object|null} Reporte actualizado o null si no se encuentra
 */
const editReporte = (id, reporteData) => {
  const reporte = reportes.find(r => r.id_control_salida === id);

  if (!reporte) {
    return null;
  }

  Object.assign(reporte, reporteData);
  return reporte;
};


module.exports = {
  getAll,
  generarReporte,
  consultarReporte,
  editReporte
};

