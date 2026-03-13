const asignacionceldasRepository = require('../repositories/asignacion-celdas.repository');

/**
 * Crea una nueva asignación de celda.
 * Verifica que la asignación no exista previamente.
 *
 * @param {Object} data - Datos de la asignación.
 * @param {number} data.id_asignacion - ID de la asignación.
 * @param {number} data.id_celda - ID de la celda.
 * @param {number} data.id_vehiculo - ID del vehículo.
 * @param {number} data.id_conductor - ID del conductor.
 * @param {string} data.fecha_ingreso - Fecha de ingreso.
 * @param {string} data.hora_ingreso - Hora de ingreso.
 * @param {string} data.fecha_salida - Fecha de salida.
 * @param {string} data.hora_salida - Hora de salida.
 * @param {string} data.estado - Estado de la asignación.
 * @returns {Object} Nueva asignación creada.
 * @throws {Error} Si la celda ya está asignada.
 */
const createAsignacionCelda = (data) => {

  const existing = asignacionceldasRepository.getById(data.id_asignacion);

  if (existing) {
    throw new Error('La celda ya está asignada');
  }

  return asignacionceldasRepository.create(data);
};


/**
 * Obtiene una asignación de celda por su ID.
 *
 * @param {number} id - ID de la asignación.
 * @returns {Object|null} Asignación encontrada o null si no existe.
 */
const getAsignacionById = (id) => {
  return asignacionceldasRepository.getById(id);
};


/**
 * Obtiene todas las asignaciones de celdas registradas.
 *
 * @returns {Array<Object>} Lista de asignaciones.
 */
const getAsignaciones = () => {
  return asignacionceldasRepository.getAll();
};


/**
 * Edita una asignación de celda existente.
 * Verifica que la asignación exista y que el vehículo no esté duplicado.
 *
 * @param {number} id - ID de la asignación a editar.
 * @param {Object} data - Nuevos datos de la asignación.
 * @returns {Object} Asignación actualizada.
 * @throws {Error} Si la asignación no existe.
 * @throws {Error} Si ya existe una asignación con el mismo vehículo.
 */
const editAsignacionCelda = (id, data) => {

  const asignacionExisting = asignacionceldasRepository.getById(id);

  if (!asignacionExisting) {
    throw new Error("La asignación no existe");
  }

  const duplicateAsignacion = asignacionceldasRepository.getByIdvehi(data.id_vehiculo);

  if (duplicateAsignacion && duplicateAsignacion.id_asignacion !== id) {
    throw new Error("Ya existe una asignación con ese vehículo");
  }

  return asignacionceldasRepository.editById(id, data);
};


/**
 * Elimina una asignación de celda por su ID.
 *
 * @param {number} id - ID de la asignación a eliminar.
 * @returns {Object} Asignación eliminada.
 * @throws {Error} Si la asignación no existe.
 */
const deleteAsignacionById = (id) => {

  const asignacionExisting = asignacionceldasRepository.getById(id);

  if (!asignacionExisting) {
    throw new Error("La asignación no existe");
  }

  return asignacionceldasRepository.deleteById(id);
};


module.exports = {
  createAsignacionCelda,
  getAsignacionById,
  getAsignaciones,
  editAsignacionCelda,
  deleteAsignacionById
};