/**
 * @module incidentesService
 * @description
 * Maneja la lógica de negocio de los incidentes o novedades
 * registradas dentro del parqueadero.
 *
 * Flujo:
 * Controller → Service → Repository
 */

const incidenteRepository = require('../repositories/incidentes.repository');

/**
 * Crear incidente
 *
 * @function createIncidente
 * @param {Object} data
 * @returns {Object}
 */
const createIncidente = (data) => {

  if (!data.descripcion) {
    throw new Error("La descripción del incidente es obligatoria");
  }

  return incidenteRepository.create(data);
};

/**
 * Obtener todos los incidentes
 *
 * @function getIncidentes
 * @returns {Array<Object>}
 */
const getIncidentes = () => incidenteRepository.getAll();

/**
 * Obtener incidente por ID
 *
 * @function getIncidenteById
 * @param {number} id
 * @returns {Object}
 */
const getIncidenteById = (id) => {

  const incidente = incidenteRepository.getById(id);

  if (!incidente) {
    throw new Error("El incidente no existe");
  }

  return incidente;
};

/**
 * Editar incidente
 *
 * @function editIncidente
 * @param {number} id
 * @param {Object} data
 * @returns {Object}
 */
const editIncidente = (id, data) => {

  const incidente = incidenteRepository.getById(id);

  if (!incidente) {
    throw new Error("El incidente no existe");
  }

  return incidenteRepository.editById(id, data);
};

/**
 * Eliminar incidente
 *
 * @function deleteIncidente
 * @param {number} id
 * @returns {Object}
 */
const deleteIncidente = (id) => {

  const incidente = incidenteRepository.getById(id);

  if (!incidente) {
    throw new Error("El incidente no existe");
  }

  return incidenteRepository.deleteById(id);
};

module.exports = {
  createIncidente,
  getIncidentes,
  getIncidenteById,
  editIncidente,
  deleteIncidente
};