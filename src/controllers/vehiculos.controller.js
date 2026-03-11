/**
 * @module VehiculoController
 * @description Controlador encargado de manejar las peticiones HTTP
 * relacionadas con los vehículos.
 */

const vehiculoService = require('../services/vehiculos.services');

/**
 * Crear un nuevo vehículo.
 *
 * @function createVehiculo

 * @returns {Object} Vehículo creado.
 */
const createVehiculo = (req, res) => {
  try {
    const vehiculo = vehiculoService.createVehiculo(req.body);
    res.status(201).json(vehiculo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Obtener todos los vehículos registrados.
 *
 * @function getVehiculos

 * @returns {Array<Object>} Lista de vehículos.
 */
const getVehiculos = (req, res) => {
  const vehiculos = vehiculoService.getVehiculos();
  res.json(vehiculos);
};

/**
 * Editar un vehículo existente.
 *
 * @function editVehiculo

 * @returns {Object} Vehículo actualizado.
 */
const editVehiculo = (req, res) => {
  try {
    const id = parseInt(req.params.id_vehiculo);
    const data = req.body;

    const updatedVehiculo = vehiculoService.editVehiculo(id, data);

    res.json(updatedVehiculo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Eliminar un vehículo por su ID.
 *
 * @function deleteVehiculo

 * @returns {Object} Vehículo eliminado.
 */
const deleteVehiculo = (req, res) => {
  try {
    const id = parseInt(req.params.id_vehiculo);

    const deletedVehiculo = vehiculoService.deleteVehiculoById(id);

    res.json(deletedVehiculo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createVehiculo,
  getVehiculos,
  editVehiculo,
  deleteVehiculo
};