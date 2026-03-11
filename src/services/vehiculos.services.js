/**
 * @module VehiculoService
 * @description
 * Servicio encargado de manejar la lógica de negocio
 * relacionada con los vehículos dentro del sistema.
 */

const vehiculoRepository = require('../repositories/vehiculos.repository');

/**
 * Crea un nuevo vehículo en el sistema.
 *
 * @function createVehiculo
 * @param {Object} data - Datos del vehículo
 * @param {string} data.placa - Placa del vehículo
 * @param {string} data.tipoVehiculo - Tipo de vehículo
 * @param {string} data.marca - Marca del vehículo
 * @param {string} data.modelo - Modelo del vehículo
 * @param {string} data.color - Color del vehículo
 * @param {number} data.id_conductor - ID del conductor asociado
 * @returns {Object} Vehículo creado
 * @throws {Error} Si el vehículo ya existe
 */
const createVehiculo = (data) => {

  const existing = vehiculoRepository.getByPlaca(data.placa);

  if (existing) {
    throw new Error('El vehiculo ya existe');
  }

  return vehiculoRepository.create(data);
};

/**
 * Obtiene todos los vehículos registrados.
 *
 * @function getVehiculos
 * @returns {Array<Object>} Lista de vehículos
 */
const getVehiculos = () => vehiculoRepository.getAll();

/**
 * Edita un vehículo existente.
 *
 * @function editVehiculo
 * @param {number} id - ID del vehículo
 * @param {Object} data - Datos del vehículo a actualizar
 * @returns {Object} Vehículo actualizado
 * @throws {Error} Si el vehículo no existe
 * @throws {Error} Si ya existe otro vehículo con la misma placa
 */
const editVehiculo = (id, data) => {

  const vehiculoExisting = vehiculoRepository.getById(id);

  if (!vehiculoExisting) {
    throw new Error("El vehiculo no existe");
  }

  const duplicateVehiculo = vehiculoRepository.getByPlaca(data.placa);

  if (duplicateVehiculo && duplicateVehiculo.id_vehiculo !== id) {
    throw new Error("Ya existe un vehiculo con esa placa");
  }

  return vehiculoRepository.editById(id, data);
};

/**
 * Elimina un vehículo por su ID.
 *
 * @function deleteVehiculoById
 * @param {number} id - ID del vehículo
 * @returns {Object} Vehículo eliminado
 * @throws {Error} Si el vehículo no existe
 */
const deleteVehiculoById = (id) => {

  const vehiculoExisting = vehiculoRepository.getById(id);

  if (!vehiculoExisting) {
    throw new Error("El vehiculo no existe");
  }

  return vehiculoRepository.deleteById(id);
};

module.exports = {
  createVehiculo,
  getVehiculos,
  editVehiculo,
  deleteVehiculoById
};