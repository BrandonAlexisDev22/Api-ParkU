/**
 * @module VehiculoRepository
 * @description
 * Repositorio encargado de manejar las operaciones CRUD
 * de los vehículos dentro del sistema.
 */

let vehiculos = [];
let idCounter = 1;

/**
 * Obtiene todos los vehículos registrados.
 *
 * @function getAll
 * @returns {Array<Object>} Lista de vehículos
 */
const getAll = () => vehiculos;

/**
 * Busca un vehículo por su ID.
 *
 * @function getById
 * @param {number} id - Identificador del vehículo
 * @returns {Object|null} Vehículo encontrado o null si no existe
 */
const getById = (id) => vehiculos.find(v => v.id_vehiculo === id);

/**
 * Busca un vehículo por su placa.
 *
 * @function getByPlaca
 * @param {string} placa - Placa del vehículo
 * @returns {Object|null} Vehículo encontrado o null si no existe
 */
const getByPlaca = (placa) => vehiculos.find(v => v.placa === placa);

/**
 * Crea un nuevo vehículo en el sistema.
 *
 * @function create
 * @param {Object} vehiculoData - Datos del vehículo
 * @param {string} vehiculoData.placa - Placa del vehículo
 * @param {string} vehiculoData.tipoVehiculo - Tipo de vehículo
 * @param {string} vehiculoData.marca - Marca del vehículo
 * @param {string} vehiculoData.modelo - Modelo del vehículo
 * @param {string} vehiculoData.color - Color del vehículo
 * @param {number} vehiculoData.id_conductor - ID del conductor asociado
 * @returns {Object} Vehículo creado
 */
const create = (vehiculoData) => {
  const newVehiculo = { id_vehiculo: idCounter++, ...vehiculoData };
  vehiculos.push(newVehiculo);
  return newVehiculo;
};

/**
 * Actualiza un vehículo existente por su ID.
 *
 * @function editById
 * @param {number} id - Identificador del vehículo
 * @param {Object} vehiculoData - Datos a actualizar
 * @returns {Object|null} Vehículo actualizado o null si no existe
 */
const editById = (id, vehiculoData) => {
  const vehiculo = vehiculos.find(v => v.id_vehiculo === id);

  if (!vehiculo) {
    return null;
  }

  Object.assign(vehiculo, vehiculoData);
  return vehiculo;
};

/**
 * Elimina un vehículo por su ID.
 *
 * @function deleteById
 * @param {number} id - Identificador del vehículo
 * @returns {Object|null} Vehículo eliminado o null si no existe
 */
const deleteById = (id) => {
  const index = vehiculos.findIndex(v => v.id_vehiculo === id);

  if (index === -1) {
    return null;
  }

  const deletedVehiculo = vehiculos.splice(index, 1)[0];
  return deletedVehiculo;
};

module.exports = {
  getAll,
  getById,
  getByPlaca,
  create,
  editById,
  deleteById
};