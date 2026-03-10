/**
 * @module ConductorRepository
 * @description
 * Repositorio encargado de gestionar las operaciones CRUD
 * de los conductores dentro del sistema ParkU.
 */

let Conductores = [];
let idCounter = 1;

/**
 * Obtiene todos los conductores registrados.
 *
 * @function getAll
 * @returns {Array<Object>} Lista de conductores
 */
const getAll = () => Conductores;

/**
 * Busca un conductor por su ID.
 *
 * @function getById
 * @param {number} id - Identificador único del conductor
 * @returns {Object|null} Conductor encontrado o null si no existe
 */
const getById = (id) => Conductores.find(c => c.id_conductor === id);

/**
 * Busca un conductor por su nombre.
 *
 * @function getByName
 * @param {string} nombre - Nombre del conductor
 * @returns {Object|null} Conductor encontrado o null si no existe
 */
const getByName = (nombre) => Conductores.find(c => c.nombre === nombre);

/**
 * Crea un nuevo conductor en el sistema.
 *
 * @function create
 * @param {Object} conductorData - Datos del conductor
 * @param {string} conductorData.nombre - Nombre del conductor
 * @param {string} conductorData.apellido - Apellido del conductor
 * @param {string} conductorData.numeroDocumento - Número de documento
 * @param {string} conductorData.tipoDocumento - Tipo de documento
 * @param {string} conductorData.telefono - Número de teléfono
 * @param {string} conductorData.correo - Correo electrónico
 * @returns {Object} Conductor creado
 */
const create = (conductorData) => {
  const newConductor = { id_conductor: idCounter++, ...conductorData };
  Conductores.push(newConductor);
  return newConductor;
};

/**
 * Edita un conductor existente por su ID.
 *
 * @function editById
 * @param {number} id - Identificador del conductor
 * @param {Object} conductorData - Datos a actualizar
 * @returns {Object|null} Conductor actualizado o null si no existe
 */
const editById = (id, conductorData) => {
  const conductor = Conductores.find(c => c.id_conductor === id);

  if (!conductor) {
    return null;
  }

  Object.assign(conductor, conductorData);
  return conductor;
};

/**
 * Elimina un conductor por su ID.
 *
 * @function deleteById
 * @param {number} id - Identificador del conductor
 * @returns {Object|null} Conductor eliminado o null si no existe
 */
const deleteById = (id) => {
  const index = Conductores.findIndex(c => c.id_conductor === id);

  if (index === -1) {
    return null;
  }

  const deletedConductor = Conductores.splice(index, 1)[0];
  return deletedConductor;
};

module.exports = {
  getAll,
  getById,
  getByName,
  create,
  editById,
  deleteById
};