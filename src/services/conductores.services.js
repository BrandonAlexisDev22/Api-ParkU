/**
 * @module ConductorService
 * @description
 * Servicio encargado de manejar la lógica de negocio
 * relacionada con los conductores en el sistema ParkU.
 */

const ConductorRepository = require('../repositories/conductores.repository');

/**
 * Crea un nuevo conductor en el sistema.
 *
 * @function createConductor
 * @param {Object} data - Datos del conductor
 * @param {string} data.nombre - Nombre del conductor
 * @param {string} data.apellido - Apellido del conductor
 * @param {string} data.numeroDocumento - Número de documento
 * @param {string} data.tipoDocumento - Tipo de documento
 * @param {string} data.telefono - Teléfono del conductor
 * @param {string} data.correo - Correo electrónico
 * @returns {Object} Conductor creado
 * @throws {Error} Si el conductor ya existe
 */
const createConductor = (data) => {

  const existing = ConductorRepository.getByName(data.nombre);

  if (existing) {
    throw new Error('El conductor ya existe');
  }

  return ConductorRepository.create(data);
};

/**
 * Obtiene todos los conductores registrados.
 *
 * @function getConductores
 * @returns {Array<Object>} Lista de conductores
 */
const getConductores = () => ConductorRepository.getAll();

/**
 * Edita un conductor existente.
 *
 * @function editConductor
 * @param {number} id - ID del conductor
 * @param {Object} data - Datos a actualizar
 * @returns {Object} Conductor actualizado
 * @throws {Error} Si el conductor no existe
 * @throws {Error} Si ya existe otro conductor con el mismo nombre
 */
const editConductor = (id, data) => {

  const conductorExisting = ConductorRepository.getById(id);

  if (!conductorExisting) {
    throw new Error("El conductor no existe");
  }

  const duplicateConductor = ConductorRepository.getByName(data.nombre);

  if (duplicateConductor && duplicateConductor.id_conductor !== id) {
    throw new Error("Ya existe un conductor con ese nombre");
  }

  return ConductorRepository.editById(id, data);
};

/**
 * Elimina un conductor por su ID.
 *
 * @function deleteConductorById
 * @param {number} id - ID del conductor
 * @returns {Object} Conductor eliminado
 * @throws {Error} Si el conductor no existe
 */
const deleteConductorById = (id) => {

  const conductorExisting = ConductorRepository.getById(id);

  if (!conductorExisting) {
    throw new Error("El conductor no existe");
  }

  return ConductorRepository.deleteById(id);
};

module.exports = {
  createConductor,
  getConductores,
  editConductor,
  deleteConductorById
};