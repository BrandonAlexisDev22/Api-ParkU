/**
 * @module celdasService
 * @description
 * Service encargado de manejar la lógica de negocio de las celdas.
 *
 * Responsabilidades:
 * - Validar datos
 * - Aplicar reglas de negocio
 * - Comunicarse con el repository
 *
 * Flujo:
 * Controller → Service → Repository → Datos
 */

const celdaRepository = require('../repositories/celdas.repository');

/**
 * Crear una nueva celda
 *
 * Regla de negocio:
 * No se pueden repetir números de celda.
 *
 * @function createCelda
 * @memberof module:celdasService
 *
 * @param {Object} data - Datos de la celda
 *
 * @returns {Object} Celda creada
 *
 * @throws {Error} Si la celda ya existe
 */
const createCelda = (data) => {

  const existing = celdaRepository.getByNumero(data.numero);

  if (existing) {
    throw new Error("La celda ya existe");
  }

  return celdaRepository.create(data);
};

/**
 * Obtener todas las celdas
 *
 * @function getCeldas
 * @memberof module:celdasService
 *
 * @returns {Array<Object>} Lista de celdas
 */
const getCeldas = () => celdaRepository.getAll();

/**
 * Obtener una celda por ID
 *
 * @function getCeldaById
 * @memberof module:celdasService
 *
 * @param {number} id - ID de la celda
 *
 * @returns {Object} Celda encontrada
 */
const getCeldaById = (id) => celdaRepository.getById(id);

/**
 * Editar una celda existente
 *
 * @function editCelda
 * @memberof module:celdasService
 *
 * @param {number} id - ID de la celda
 * @param {Object} data - Nuevos datos
 *
 * @returns {Object} Celda actualizada
 *
 * @throws {Error} Si la celda no existe
 * @throws {Error} Si el número ya está en uso
 */
const editCelda = (id, data) => {

  const existing = celdaRepository.getById(id);

  if (!existing) {
    throw new Error("La celda no existe");
  }

  const duplicate = celdaRepository.getByNumero(data.numero);

  if (duplicate && duplicate.id_celda !== id) {
    throw new Error("Ya existe una celda con ese número");
  }

  return celdaRepository.editById(id, data);
};

/**
 * Eliminar una celda
 *
 * @function deleteCeldaById
 * @memberof module:celdasService
 *
 * @param {number} id - ID de la celda
 *
 * @returns {Object} Celda eliminada
 *
 * @throws {Error} Si la celda no existe
 */
const deleteCeldaById = (id) => {

  const existing = celdaRepository.getById(id);

  if (!existing) {
    throw new Error("La celda no existe");
  }

  return celdaRepository.deleteById(id);
};

module.exports = {
  createCelda,
  getCeldas,
  getCeldaById,
  editCelda,
  deleteCeldaById
};