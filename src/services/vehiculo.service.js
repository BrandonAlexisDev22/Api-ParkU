/**
 * @module VehiculoService
 * @description Lógica de negocio para la gestión de vehículos.
 * Alineado con el modelo Vehiculo.
 */

const repo = require('../repositories/vehiculo.repository');
const conductorRepo = require('../repositories/conductor.repository');

/**
 * @swagger
 * components:
 *   schemas:
 *     Vehiculo:
 *       type: object
 *       required:
 *         - conductor
 *         - placa
 *       properties:
 *         id:
 *           type: integer
 *         conductor:
 *           type: integer
 *         placa:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO, BICICLETA]
 *         marca:
 *           type: string
 *           nullable: true
 *         modelo:
 *           type: string
 *           nullable: true
 *         anio:
 *           type: integer
 *           nullable: true
 *         color:
 *           type: string
 *           nullable: true
 *         descripcion:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: boolean
 *           default: true
 *         conductor_nombre:
 *           type: string
 *           description: Nombre del conductor (solo lectura)
 *     VehiculoCreate:
 *       type: object
 *       required:
 *         - conductor
 *         - placa
 *       properties:
 *         conductor:
 *           type: integer
 *         placa:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO, BICICLETA]
 *         marca:
 *           type: string
 *           nullable: true
 *         modelo:
 *           type: string
 *           nullable: true
 *         anio:
 *           type: integer
 *           nullable: true
 *         color:
 *           type: string
 *           nullable: true
 *         descripcion:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: boolean
 *           default: true
 *     VehiculoUpdate:
 *       type: object
 *       properties:
 *         conductor:
 *           type: integer
 *         placa:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO, BICICLETA]
 *         marca:
 *           type: string
 *           nullable: true
 *         modelo:
 *           type: string
 *           nullable: true
 *         anio:
 *           type: integer
 *           nullable: true
 *         color:
 *           type: string
 *           nullable: true
 *         descripcion:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: boolean
 */

/**
 * Obtiene la lista global de vehículos.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca un vehículo por su ID.
 * @param {number} id 
 * @throws {Object} 404 si el vehículo no existe.
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Vehículo no encontrado' };
  return item;
};

/**
 * Obtiene todos los vehículos asociados a un conductor.
 * @param {number} conductorId 
 * @returns {Promise<Array>}
 */
const getByConductor = (conductorId) => repo.findByConductor(conductorId);

/**
 * Registra un nuevo vehículo validando conductor y placa.
 * @param {Object} data - Datos del vehículo (todos los campos)
 * @throws {Object} 400 si faltan datos, 404 si conductor no existe, 409 si placa duplicada.
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  const { conductor, placa } = data;
  if (!conductor || !placa) {
    throw { status: 400, message: 'conductor y placa son requeridos' };
  }

  const conductorExiste = await conductorRepo.findById(conductor);
  if (!conductorExiste) {
    throw { status: 404, message: 'Conductor no encontrado' };
  }

  const placaExiste = await repo.findByPlaca(placa);
  if (placaExiste) {
    throw { status: 409, message: 'La placa ya está registrada' };
  }

  return repo.create(data);
};

/**
 * Actualiza un vehículo validando conductor y placa (si se cambian).
 * @param {number} id 
 * @param {Object} data - Campos a actualizar
 * @throws {Object} 404 si no existe, 400 si datos inválidos, 404 si nuevo conductor no existe, 409 si placa duplicada.
 * @returns {Promise<Object>}
 */
const update = async (id, data) => {
  const vehiculo = await getById(id);

  // Validar nuevo conductor si se envía
  if (data.conductor !== undefined && data.conductor !== vehiculo.conductor) {
    const conductorExiste = await conductorRepo.findById(data.conductor);
    if (!conductorExiste) {
      throw { status: 404, message: 'Conductor no encontrado' };
    }
  }

  // Validar nueva placa si se envía
  if (data.placa && data.placa !== vehiculo.placa) {
    const dup = await repo.findByPlaca(data.placa);
    if (dup && dup.id !== id) {
      throw { status: 409, message: 'La placa ya está registrada' };
    }
  }

  return repo.update(id, data);
};

/**
 * Elimina un vehículo del sistema.
 * @param {number} id 
 * @throws {Object} 404 si no existe, 409 si está en uso en reservas o movimientos.
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  await getById(id);
  try {
    return await repo.remove(id);
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw { status: 409, message: 'No se puede eliminar porque el vehículo tiene registros asociados (reservas o movimientos)' };
    }
    throw error;
  }
};

module.exports = { getAll, getById, getByConductor, create, update, remove };