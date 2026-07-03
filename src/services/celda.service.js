/**
 * @module CeldaService
 * @description Lógica de negocio para la gestión de celdas de parqueo.
 * Alineado con el modelo Celda (tipo, usabilidad, estado_celda).
 */

const repo = require('../repositories/celda.repository');
const parqRepo = require('../repositories/parqueadero.repository');

// Constantes para facilitar validaciones y evitar errores tipográficos
const TIPOS_PERMITIDOS = ['CARRO', 'MOTO', 'MOVILIDAD_REDUCIDA', 'BICICLETA'];
const USABILIDADES_PERMITIDAS = ['GENERAL', 'EJECUTIVO', 'MOVILIDAD_REDUCIDA'];
const ESTADOS_PERMITIDOS = ['DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO', 'INACTIVA'];

/**
 * @swagger
 * components:
 *   schemas:
 *     Celda:
 *       type: object
 *       required:
 *         - parqueadero
 *         - tipo
 *         - usabilidad
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental de la celda.
 *         parqueadero:
 *           type: integer
 *           description: ID del parqueadero al que pertenece.
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO, MOVILIDAD_REDUCIDA, BICICLETA]
 *           description: Tipo de vehículo que puede ocupar la celda.
 *         usabilidad:
 *           type: string
 *           enum: [GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA]
 *           description: Nivel de uso permitido.
 *         estado_celda:
 *           type: string
 *           enum: [DISPONIBLE, OCUPADO, MANTENIMIENTO, INACTIVA]
 *           description: Estado actual de la celda.
 *         parqueadero_nombre:
 *           type: string
 *           description: Nombre del parqueadero (solo en respuestas con JOIN).
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
 * @returns {Promise<Object>} Datos de la celda.
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Celda no encontrada' };
  return item;
};

/**
 * Filtra celdas por parqueadero.
 * @param {number} parqueaderoId 
 * @returns {Promise<Array>}
 */
const getByParqueadero = (parqueaderoId) => repo.findByParqueadero(parqueaderoId);

/**
 * Obtiene celdas disponibles (estado_celda = 'DISPONIBLE') en un parqueadero.
 * @param {number} parqueaderoId 
 * @returns {Promise<Array>}
 */
const getDisponibles = (parqueaderoId) => repo.findDisponibles(parqueaderoId);

/**
 * Filtra celdas por tipo de vehículo.
 * @param {string} tipo - CARRO, MOTO, MOVILIDAD_REDUCIDA, BICICLETA
 * @returns {Promise<Array>}
 */
const getByTipo = async (tipo) => {
  if (!TIPOS_PERMITIDOS.includes(tipo)) {
    throw { status: 400, message: `Tipo no válido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }
  // Nota: Se asume que el repositorio tiene un método findByTipo; si no existe, se puede implementar.
  // Por ahora, se filtra en memoria (no óptimo para grandes volúmenes).
  const todas = await repo.findAll();
  return todas.filter(c => c.tipo === tipo);
};

/**
 * Filtra celdas por usabilidad.
 * @param {string} usabilidad - GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA
 * @returns {Promise<Array>}
 */
const getByUsabilidad = async (usabilidad) => {
  if (!USABILIDADES_PERMITIDAS.includes(usabilidad)) {
    throw { status: 400, message: `Usabilidad no válida. Permitidas: ${USABILIDADES_PERMITIDAS.join(', ')}` };
  }
  const todas = await repo.findAll();
  return todas.filter(c => c.usabilidad === usabilidad);
};

/**
 * Crea una nueva celda validando existencia del parqueadero y valores permitidos.
 * @param {Object} data 
 * @param {number} data.parqueadero - ID del parqueadero.
 * @param {string} data.tipo - Tipo de celda.
 * @param {string} data.usabilidad - Usabilidad.
 * @param {string} [data.estado_celda='DISPONIBLE'] - Estado inicial.
 * @throws {Object} 400 si faltan datos o son inválidos; 404 si el parqueadero no existe.
 * @returns {Promise<Object>} Celda creada.
 */
const create = async ({ parqueadero, tipo, usabilidad, estado_celda = 'DISPONIBLE' }) => {
  // Validaciones
  if (!parqueadero) throw { status: 400, message: 'El parqueadero es requerido' };
  if (!tipo) throw { status: 400, message: 'El tipo es requerido' };
  if (!usabilidad) throw { status: 400, message: 'La usabilidad es requerida' };

  if (!TIPOS_PERMITIDOS.includes(tipo)) {
    throw { status: 400, message: `Tipo inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }
  if (!USABILIDADES_PERMITIDAS.includes(usabilidad)) {
    throw { status: 400, message: `Usabilidad inválida. Permitidas: ${USABILIDADES_PERMITIDAS.join(', ')}` };
  }
  if (!ESTADOS_PERMITIDOS.includes(estado_celda)) {
    throw { status: 400, message: `Estado inválido. Permitidos: ${ESTADOS_PERMITIDOS.join(', ')}` };
  }

  // Verificar existencia del parqueadero
  const existeParq = await parqRepo.findById(parqueadero);
  if (!existeParq) throw { status: 404, message: 'Parqueadero no encontrado' };

  return repo.create({ parqueadero, tipo, usabilidad, estado_celda });
};

/**
 * Actualiza parcialmente una celda.
 * @param {number} id - ID de la celda.
 * @param {Object} data - Campos a actualizar (todos opcionales).
 * @param {string} [data.tipo] - Nuevo tipo.
 * @param {string} [data.usabilidad] - Nueva usabilidad.
 * @param {string} [data.estado_celda] - Nuevo estado.
 * @throws {Object} 404 si la celda no existe; 400 si algún valor no es permitido.
 * @returns {Promise<Object>} Celda actualizada.
 */
const update = async (id, data) => {
  // Verificar que la celda existe
  await getById(id);

  // Validar valores si se proporcionan
  if (data.tipo && !TIPOS_PERMITIDOS.includes(data.tipo)) {
    throw { status: 400, message: `Tipo inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }
  if (data.usabilidad && !USABILIDADES_PERMITIDAS.includes(data.usabilidad)) {
    throw { status: 400, message: `Usabilidad inválida. Permitidas: ${USABILIDADES_PERMITIDAS.join(', ')}` };
  }
  if (data.estado_celda && !ESTADOS_PERMITIDOS.includes(data.estado_celda)) {
    throw { status: 400, message: `Estado inválido. Permitidos: ${ESTADOS_PERMITIDOS.join(', ')}` };
  }

  return repo.update(id, data);
};

/**
 * Elimina una celda del sistema.
 * @param {number} id - ID de la celda.
 * @throws {Object} 404 si no existe.
 * @returns {Promise<boolean>}
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
  getByTipo,
  getByUsabilidad,
  create,
  update,
  remove,
};