const asignacionceldasRepository = require('../repositories/asignacion-celdas.repository');

/**
 * Crea una nueva asignación de celda
 */
const createAsignacionCelda = async (data) => {

  const existing = await asignacionceldasRepository.getById(data.id);

  if (existing) {
    throw new Error('La asignación ya existe');
  }

  return await asignacionceldasRepository.create(data);
};


/**
 * Obtiene asignación por ID
 */
const getAsignacionById = async (id) => {
  return await asignacionceldasRepository.getById(id);
};


/**
 * Obtiene todas las asignaciones
 */
const getAsignaciones = async () => {
  return await asignacionceldasRepository.getAll();
};


/**
 * Edita una asignación
 */
const editAsignacionCelda = async (id, data) => {

  const asignacionExisting = await asignacionceldasRepository.getById(id);

  if (!asignacionExisting) {
    throw new Error("La asignación no existe");
  }

  const duplicateAsignacion = await asignacionceldasRepository.getByVehiculo(data.vehiculo);

  if (duplicateAsignacion && duplicateAsignacion.length > 0 && duplicateAsignacion[0].id !== id) {
    throw new Error("Ya existe una asignación con ese vehículo");
  }

  return await asignacionceldasRepository.editById(id, data);
};


/**
 * Elimina una asignación
 */
const deleteAsignacionById = async (id) => {

  const asignacionExisting = await asignacionceldasRepository.getById(id);

  if (!asignacionExisting) {
    throw new Error("La asignación no existe");
  }

  return await asignacionceldasRepository.deleteById(id);
};


module.exports = {
  createAsignacionCelda,
  getAsignacionById,
  getAsignaciones,
  editAsignacionCelda,
  deleteAsignacionById
};