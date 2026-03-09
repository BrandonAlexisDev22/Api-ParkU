// Arreglo que simula una base de datos en memoria
let parqueaderos = [];

// Contador para generar IDs automáticamente
let idCounter = 1;

/**
 * Obtiene todos los parqueaderos almacenados
 *
 * @function getAll
 * @memberof module:parqueaderosRepository
 * @returns {Array<Object>} Lista de parqueaderos
 */
const getAll = () => parqueaderos;

/**
 * Busca un parqueadero por su ID
 *
 * @function getById
 * @memberof module:parqueaderosRepository
 * @param {number} id - Identificador del parqueadero
 * @returns {Object|undefined} Parqueadero encontrado o undefined si no existe
 */
const getById = (id) => parqueaderos.find(p => p.id_parqueadero === id);

/**
 * Busca un parqueadero por su nombre
 *
 * @function getByName
 * @memberof module:parqueaderosRepository
 * @param {string} name - Nombre del parqueadero
 * @returns {Object|undefined} Parqueadero encontrado o undefined si no existe
 */
const getByName = (name) => parqueaderos.find(p => p.nombre === name);

/**
 * Crea un nuevo parqueadero
 *
 * Genera automáticamente un ID y guarda el parqueadero en memoria.
 *
 * @function create
 * @memberof module:parqueaderosRepository
 *
 * @param {Object} parqueaderoData - Datos del parqueadero
 * @param {string} parqueaderoData.nombre - Nombre del parqueadero
 * @param {string} parqueaderoData.direccion - Dirección del parqueadero
 * @param {number} parqueaderoData.capacidad_total - Capacidad total del parqueadero
 * @param {number} parqueaderoData.espacios_disponibles - Espacios disponibles
 * @param {boolean} parqueaderoData.estado - Estado del parqueadero
 *
 * @returns {Object} Parqueadero creado
 */
const create = (parqueaderoData) => {
  const newParqueadero = { id_parqueadero: idCounter++, ...parqueaderoData };
  parqueaderos.push(newParqueadero);
  return newParqueadero;
};

/**
 * Edita un parqueadero existente por su ID
 *
 * Busca un parqueadero en la lista y actualiza sus datos.
 *
 * @function editById
 * @memberof module:parqueaderosRepository
 *
 * @param {number} id - ID del parqueadero a editar
 * @param {Object} parqueaderoData - Nuevos datos del parqueadero
 *
 * @returns {Object|null} Parqueadero actualizado o null si no se encuentra
 */
const editById = (id, parqueaderoData) => {
  const parqueadero = parqueaderos.find(p => p.id_parqueadero === id);

  if (!parqueadero) {
    return null;
  }

  Object.assign(parqueadero, parqueaderoData);
  return parqueadero;
};

/**
 * Elimina un parqueadero por su ID
 *
 * @function deleteById
 * @memberof module:parqueaderosRepository
 *
 * @param {number} id - ID del parqueadero a eliminar
 * @returns {Object|null} Parqueadero eliminado o null si no existe
 */
const deleteById = (id) => {
  const index = parqueaderos.findIndex(p => p.id_parqueadero === id);

  if (index === -1) {
    return null;
  }

  const deletedParqueadero = parqueaderos.splice(index, 1)[0];
  return deletedParqueadero;
};

module.exports = {
  getAll,
  getById,
  getByName,
  create,
  editById,
  deleteById
};