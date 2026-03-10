/**
 * @module incidentesRepository
 * @description
 * Repository encargado de manejar el acceso a datos de los incidentes
 * o novedades registradas dentro del sistema de parqueaderos.
 *
 * Simula una base de datos en memoria.
 */

let incidentes = [];
let idCounter = 1;

/**
 * Obtener todos los incidentes
 *
 * @function getAll
 * @returns {Array<Object>}
 */
const getAll = () => incidentes;

/**
 * Buscar incidente por ID
 *
 * @function getById
 * @param {number} id
 * @returns {Object|undefined}
 */
const getById = (id) => incidentes.find(i => i.id_incidente === id);

/**
 * Crear incidente
 *
 * @function create
 * @param {Object} data
 * @returns {Object}
 */
const create = (data) => {

  const incidente = {
    id_incidente: idCounter++,
    ...data
  };

  incidentes.push(incidente);

  return incidente;
};

/**
 * Editar incidente
 *
 * @function editById
 * @param {number} id
 * @param {Object} data
 * @returns {Object|null}
 */
const editById = (id, data) => {

  const incidente = incidentes.find(i => i.id_incidente === id);

  if (!incidente) return null;

  Object.assign(incidente, data);

  return incidente;
};

/**
 * Eliminar incidente
 *
 * @function deleteById
 * @param {number} id
 * @returns {Object|null}
 */
const deleteById = (id) => {

  const index = incidentes.findIndex(i => i.id_incidente === id);

  if (index === -1) return null;

  return incidentes.splice(index, 1)[0];
};

module.exports = {
  getAll,
  getById,
  create,
  editById,
  deleteById
};