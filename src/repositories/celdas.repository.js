/**
 * @module celdasRepository
 * @description
 * Repository encargado del acceso a datos de las celdas.
 * Simula una base de datos en memoria.
 *
 * Responsabilidades:
 * - CRUD de celdas
 * - Manejo directo de datos
 *
 * Flujo:
 * Service → Repository → Base de datos (simulada)
 */

// Arreglo que simula una base de datos
let celdas = [];

// Contador para generar IDs automáticamente
let idCounter = 1;

/**
 * Obtiene todas las celdas almacenadas
 *
 * @function getAll
 * @memberof module:celdasRepository
 *
 * @returns {Array<Object>} Lista de celdas
 */
const getAll = () => celdas;

/**
 * Busca una celda por su ID
 *
 * @function getById
 * @memberof module:celdasRepository
 *
 * @param {number} id - Identificador de la celda
 *
 * @returns {Object|undefined} Celda encontrada o undefined
 */
const getById = (id) => celdas.find(c => c.id_celda === id);

/**
 * Busca una celda por su número
 *
 * @function getByNumero
 * @memberof module:celdasRepository
 *
 * @param {string} numero - Número de la celda
 *
 * @returns {Object|undefined} Celda encontrada
 */
const getByNumero = (numero) => celdas.find(c => c.numero === numero);

/**
 * Crea una nueva celda
 *
 * @function create
 * @memberof module:celdasRepository
 *
 * @param {Object} celdaData - Datos de la celda
 * @param {string} celdaData.numero - Número de celda
 * @param {string} celdaData.tipo - Tipo de celda (carro, moto)
 * @param {string} celdaData.estado - Estado de la celda
 * @param {number} celdaData.id_parqueadero - ID del parqueadero
 *
 * @returns {Object} Celda creada
 */
const create = (celdaData) => {
  const newCelda = { id_celda: idCounter++, ...celdaData };
  celdas.push(newCelda);
  return newCelda;
};

/**
 * Edita una celda existente
 *
 * @function editById
 * @memberof module:celdasRepository
 *
 * @param {number} id - ID de la celda
 * @param {Object} celdaData - Nuevos datos
 *
 * @returns {Object|null} Celda actualizada o null si no existe
 */
const editById = (id, celdaData) => {
  const celda = celdas.find(c => c.id_celda === id);

  if (!celda) return null;

  Object.assign(celda, celdaData);

  return celda;
};

/**
 * Elimina una celda por su ID
 *
 * @function deleteById
 * @memberof module:celdasRepository
 *
 * @param {number} id - ID de la celda
 *
 * @returns {Object|null} Celda eliminada o null si no existe
 */
const deleteById = (id) => {
  const index = celdas.findIndex(c => c.id_celda === id);

  if (index === -1) return null;

  return celdas.splice(index, 1)[0];
};

module.exports = {
  getAll,
  getById,
  getByNumero,
  create,
  editById,
  deleteById
};