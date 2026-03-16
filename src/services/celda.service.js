/**
 * @module CeldaService
 * @description Lógica de negocio para la gestión de celdas de parqueo.
 */

const repo     = require('../repositories/celda.repository');
const parqRepo = require('../repositories/parqueadero.repository');

/**
 * @swagger
 * components:
 * schemas:
 * Celda:
 * type: object
 * required:
 * - parqueadero
 * properties:
 * id:
 * type: integer
 * description: ID autoincremental de la celda.
 * parqueadero:
 * type: integer
 * description: ID del parqueadero al que pertenece.
 * discapacidad:
 * type: boolean
 * description: Indica si la celda es para personas con movilidad reducida.
 * estado:
 * type: string
 * enum: [disponible, ocupado, reservado]
 * description: Estado actual de la celda.
 */

/**
 * Obtiene todas las celdas registradas.
 * @returns {Promise<Array>} Lista de celdas.
 */
const getAll = () => repo.findAll();

/**
 * Busca una celda por su ID.
 * @param {number} id - ID de la celda.
 * @throws {Object} 404 si no existe.
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Celda no encontrada' };
  return item;
};

/**
 * Filtra celdas por parqueadero.
 * @param {number} parqueaderoId 
 */
const getByParqueadero = (parqueaderoId) => repo.findByParqueadero(parqueaderoId);

/**
 * Obtiene celdas con estado 'disponible' en un parqueadero.
 * @param {number} parqueaderoId 
 */
const getDisponibles = (parqueaderoId) => repo.findDisponibles(parqueaderoId);

/**
 * Crea una nueva celda validando la existencia del parqueadero.
 * @param {Object} data - { parqueadero, discapacidad }
 * @throws {Object} 400 si falta el parqueadero, 404 si el parqueadero no existe.
 */
const create = async ({ parqueadero, discapacidad }) => {
  if (!parqueadero) throw { status: 400, message: 'El parqueadero es requerido' };
  
  const existe = await parqRepo.findById(parqueadero);
  if (!existe) throw { status: 404, message: 'Parqueadero no encontrado' };
  
  return repo.create({ parqueadero, discapacidad });
};

/**
 * Actualiza los datos de una celda.
 * @param {number} id 
 * @param {Object} datos 
 */
const update = async (id, datos) => {
  await getById(id);
  return repo.update(id, datos);
};

/**
 * Elimina una celda del sistema.
 * @param {number} id 
 */
const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { 
  getAll, 
  getById, 
  getByParqueadero, 
  getDisponibles, 
  create, 
  update, 
  remove 
};