/**
 * @module parqueaderosService
 * @description
 * Service encargado de manejar la lógica de negocio de los parqueaderos
 * dentro de la arquitectura MVC.
 *
 * Responsabilidades:
 * - Aplicar reglas de negocio
 * - Validar datos antes de enviarlos al repositorio
 * - Comunicarse con el Repository para acceder a los datos
 *
 * Flujo:
 * Controller → Service → Repository → Base de Datos
 */

// Importa el repository encargado del acceso a datos
const parqueaderoRepository = require('../repositories/parqueaderos.repository');


/**
 * Crear un nuevo parqueadero
 *
 * Regla de negocio:
 * No se puede crear un parqueadero con un nombre que ya exista.
 *
 * @function createParqueadero
 * @memberof module:parqueaderosService
 *
 * @param {Object} data - Datos del parqueadero
 * @param {string} data.nombre - Nombre del parqueadero
 * @param {number} data.capacidad - Cantidad de espacios
 * @param {string} data.ubicacion - Ubicación del parqueadero
 * @param {boolean} data.estado - Estado del parqueadero
 *
 * @returns {Object} Parqueadero creado
 * @throws {Error} Si el parqueadero ya existe
 */
const createParqueadero = (data) => {

  const existing = parqueaderoRepository.getByName(data.nombre);

  if (existing) {
    throw new Error('El parqueadero ya existe');
  }

  return parqueaderoRepository.create(data);
};


/**
 * Obtener todos los parqueaderos
 *
 * @function getParqueaderos
 * @memberof module:parqueaderosService
 *
 * @returns {Array<Object>} Lista de parqueaderos
 */
const getParqueaderos = () => parqueaderoRepository.getAll();


/**
 * Obtener un parqueadero por ID
 *
 * @function getParqueaderoById
 * @memberof module:parqueaderosService
 *
 * @param {number} id - ID del parqueadero
 * @returns {Object} Parqueadero encontrado
 */
const getParqueaderoById = (id) => parqueaderoRepository.getById(id);


/**
 * Editar un parqueadero existente
 *
 * Reglas de negocio:
 * - El parqueadero debe existir
 * - El nombre del parqueadero no puede duplicarse
 *
 * @function editParqueadero
 * @memberof module:parqueaderosService
 *
 * @param {number} id - ID del parqueadero
 * @param {Object} data - Nuevos datos del parqueadero
 *
 * @returns {Object} Parqueadero actualizado
 * @throws {Error} Si el parqueadero no existe
 * @throws {Error} Si el nombre ya está en uso
 */
const editParqueadero = (id, data) => {

  const parqueaderoExisting = parqueaderoRepository.getById(id);

  if (!parqueaderoExisting) {
    throw new Error("El parqueadero no existe");
  }

  const duplicateParqueadero = parqueaderoRepository.getByName(data.nombre);

  if (duplicateParqueadero && duplicateParqueadero.id_parqueadero !== id) {
    throw new Error("Ya existe un parqueadero con ese nombre");
  }

  return parqueaderoRepository.editById(id, data);
};


/**
 * Eliminar un parqueadero por su ID
 *
 * Regla de negocio:
 * - El parqueadero debe existir antes de eliminarse
 *
 * @function deleteParqueaderoById
 * @memberof module:parqueaderosService
 *
 * @param {number} id - ID del parqueadero
 * @returns {Object} Parqueadero eliminado
 * @throws {Error} Si el parqueadero no existe
 */
const deleteParqueaderoById = (id) => {

  const parqueaderoExisting = parqueaderoRepository.getById(id);

  if (!parqueaderoExisting) {
    throw new Error("El parqueadero no existe");
  }

  return parqueaderoRepository.deleteById(id);
};


module.exports = {
  createParqueadero,
  getParqueaderos,
  getParqueaderoById,
  editParqueadero,
  deleteParqueaderoById
};