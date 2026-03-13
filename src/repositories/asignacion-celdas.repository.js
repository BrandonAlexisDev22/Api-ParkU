/**
 * Arreglo que almacena todas las asignaciones de celdas en memoria.
 * @type {Array<Object>}
 */
let asignacionDeCeldas = [];

/**
 * Contador para generar IDs únicos automáticamente.
 * @type {number}
 */
let idCounter = 1;

/**
 * Obtiene todas las asignaciones de celdas.
 * @returns {Array<Object>} Lista de asignaciones registradas.
 */
const getAll = () => asignacionDeCeldas;


/**
 * Busca una asignación por su ID.
 * @param {number} id - ID de la asignación.
 * @returns {Object|undefined} Asignación encontrada o undefined si no existe.
 */
const getById = (id) => asignacionDeCeldas.find(a => a.id_asignacion === id);


/**
 * Busca una asignación por el ID del conductor.
 * @param {number} id_con - ID del conductor.
 * @returns {Object|undefined} Asignación encontrada o undefined si no existe.
 */
const getByIdCon = (id_con) => asignacionDeCeldas.find(r => r.id_conductor === id_con);


/**
 * Busca una asignación por el ID del vehículo.
 * @param {number} id_vehi - ID del vehículo.
 * @returns {Object|undefined} Asignación encontrada o undefined si no existe.
 */
const getByIdvehi = (id_vehi) => asignacionDeCeldas.find(r => r.id_vehiculo === id_vehi);


/**
 * Crea una nueva asignación de celda.
 * Genera automáticamente el ID de la asignación.
 *
 * @param {Object} asignacionceldasData - Datos de la asignación.
 * @param {number} asignacionceldasData.id_celda
 * @param {number} asignacionceldasData.id_vehiculo
 * @param {number} asignacionceldasData.id_conductor
 * @param {string} asignacionceldasData.fecha_ingreso
 * @param {string} asignacionceldasData.hora_ingreso
 * @param {string} asignacionceldasData.fecha_salida
 * @param {string} asignacionceldasData.hora_salida
 * @param {string} asignacionceldasData.estado
 *
 * @returns {Object} Nueva asignación creada.
 */
const create = (asignacionceldasData) => {
  const newAsignacion = { id_asignacion: idCounter++, ...asignacionceldasData };
  asignacionDeCeldas.push(newAsignacion);
  return newAsignacion;
};


/**
 * Edita una asignación existente por su ID.
 *
 * @param {number} id - ID de la asignación.
 * @param {Object} asignacionData - Nuevos datos de la asignación.
 * @returns {Object|null} Asignación actualizada o null si no se encuentra.
 */
const editById = (id, asignacionData) => {
  const asignacion = asignacionDeCeldas.find(a => a.id_asignacion === id);

  if (!asignacion) {
    return null;
  }

  Object.assign(asignacion, asignacionData);
  return asignacion;
};


/**
 * Elimina una asignación de celda por su ID.
 *
 * @param {number} id - ID de la asignación.
 * @returns {Object|null} Asignación eliminada o null si no existe.
 */
const deleteById = (id) => {
  const index = asignacionDeCeldas.findIndex(a => a.id_asignacion === id);

  if (index === -1) {
    return null;
  }

  const deletedAsignacion = asignacionDeCeldas.splice(index, 1)[0];
  return deletedAsignacion;
};


module.exports = {
  getAll,
  getById,
  getByIdCon,
  getByIdvehi,
  create,
  editById,
  deleteById
};