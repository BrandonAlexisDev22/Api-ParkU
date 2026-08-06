/**
 * @module ParqueaderoService
 * @description Lógica de negocio para la administración de sedes o instalaciones de parqueo.
 * Alineado con el modelo Parqueadero (nombre, ubicacion, estado).
 */

const repo = require('../repositories/parqueadero.repository');

/**
 * @swagger
 * components:
 *   schemas:
 *     Parqueadero:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental del parqueadero.
 *         nombre:
 *           type: string
 *           description: Nombre del parqueadero.
 *         ubicacion:
 *           type: string
 *           nullable: true
 *           description: Ubicación física del parqueadero.
 *         estado:
 *           type: boolean
 *           default: true
 *           description: Estado del parqueadero (activo/inactivo).
 *     ParqueaderoCreate:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         nombre:
 *           type: string
 *         ubicacion:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: boolean
 *           default: true
 *     ParqueaderoUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *         ubicacion:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: boolean
 */

/**
 * Obtiene todas las sedes registradas.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca una sede por su ID.
 * @param {number} id
 * @throws {Object} 404 si no existe.
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Parqueadero no encontrado' };
  return item;
};

/**
 * Crea una nueva sede validando que el nombre sea único.
 * @param {Object} data - Datos del parqueadero.
 * @param {string} data.nombre
 * @param {string} [data.ubicacion]
 * @param {boolean} [data.estado=true]
 * @throws {Object} 400 si falta el nombre.
 * @throws {Object} 409 si el nombre ya está en uso.
 * @returns {Promise<Object>} Parqueadero creado.
 */
const create = async ({ nombre, ubicacion, estado = true }) => {
  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };

  const existe = await repo.findByNombre(nombre);
  if (existe) throw { status: 409, message: 'Ya existe un parqueadero con ese nombre' };

  return repo.create({ nombre, ubicacion, estado });
};

/**
 * Actualiza los datos de una sede (parcial o total).
 * @param {number} id
 * @param {Object} data - Campos a actualizar (todos opcionales).
 * @throws {Object} 404 si el parqueadero no existe.
 * @throws {Object} 409 si el nuevo nombre ya pertenece a otra sede.
 * @returns {Promise<Object>} Parqueadero actualizado.
 */
const update = async (id, data) => {
  await getById(id);

  if (data.nombre) {
    const dup = await repo.findByNombre(data.nombre);
    if (dup && dup.id !== id) {
      throw { status: 409, message: 'Ya existe un parqueadero con ese nombre' };
    }
  }

  return repo.update(id, data);
};

/**
 * Elimina una sede del sistema.
 * @param {number} id
 * @throws {Object} 404 si no existe.
 * @throws {Object} 409 si tiene celdas asociadas (integridad referencial).
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, create, update, remove };
