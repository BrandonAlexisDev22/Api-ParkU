/**
 * @module PermisoService
 * @description Lógica de negocio para la gestión de permisos individuales del sistema.
 * Estos permisos se asignan posteriormente a los roles.
 */

const repo = require('../repositories/permiso.repository');

/**
 * @swagger
 * components:
 *   schemas:
 *     Permiso:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del permiso.
 *         nombre:
 *           type: string
 *           description: Nombre técnico del permiso (ej. "GESTIONAR_PARQUEADEROS").
 *     PermisoCreate:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         nombre:
 *           type: string
 *     PermisoUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 */

/**
 * Obtiene la lista global de permisos.
 * @returns {Promise<Array>} Lista de permisos.
 */
const getAll = () => repo.findAll();

/**
 * Busca un permiso por su ID.
 * @param {number} id 
 * @throws {Object} 404 si el permiso no existe.
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Permiso no encontrado' };
  return item;
};

/**
 * Crea un nuevo permiso validando que el nombre no esté duplicado.
 * @param {Object} data - { nombre }
 * @throws {Object} 400 si el nombre es nulo, 409 si ya existe.
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  const { nombre } = data;
  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };
  
  const existe = await repo.findByNombre(nombre);
  if (existe) throw { status: 409, message: 'Ya existe un permiso con ese nombre' };
  
  // ✅ Pasar objeto al repositorio
  return repo.create({ nombre });
};

/**
 * Actualiza el nombre de un permiso (actualización parcial).
 * @param {number} id 
 * @param {Object} data - { nombre } (opcional)
 * @throws {Object} 404 si el permiso no existe, 400 si el nombre es vacío, 409 si duplicado.
 * @returns {Promise<Object>}
 */
const update = async (id, data) => {
  const permiso = await getById(id);
  
  // Si no se envía nombre, no hacemos nada (devolvemos el mismo)
  if (!data.nombre) {
    return permiso;
  }
  
  // Si se envía nombre, validamos que no esté vacío
  if (data.nombre.trim() === '') {
    throw { status: 400, message: 'El nombre no puede estar vacío' };
  }
  
  // Verificar duplicado solo si el nombre cambió
  if (data.nombre !== permiso.nombre) {
    const dup = await repo.findByNombre(data.nombre);
    if (dup && dup.id !== id) {
      throw { status: 409, message: 'Ya existe un permiso con ese nombre' };
    }
  }
  
  // ✅ Pasar objeto al repositorio
  return repo.update(id, { nombre: data.nombre });
};

/**
 * Elimina un permiso del sistema.
 * @param {number} id 
 * @throws {Object} 404 si no existe, 409 si está en uso.
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  await getById(id);
  try {
    return await repo.remove(id);
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw { status: 409, message: 'No se puede eliminar porque está asignado a algún rol' };
    }
    throw error;
  }
};

module.exports = { getAll, getById, create, update, remove };