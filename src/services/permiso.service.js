/**
 * @module PermisoService
 * @description Lógica de negocio para la gestión de permisos individuales del sistema.
 * Estos permisos se asignan posteriormente a los roles.
 */

const repo = require('../repositories/permiso.repository');

/**
 * @swagger
 * components:
 * schemas:
 * Permiso:
 * type: object
 * required:
 * - nombre
 * properties:
 * id:
 * type: integer
 * description: ID único del permiso.
 * nombre:
 * type: string
 * description: Nombre técnico del permiso (ej. "CAN_EDIT_USERS").
 * example:
 * id: 5
 * nombre: "GESTIONAR_PARQUEADEROS"
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
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Permiso no encontrado' };
  return item;
};

/**
 * Crea un nuevo permiso validando que el nombre no esté duplicado.
 * @param {string} nombre - Nombre del permiso.
 * @throws {Object} 400 si el nombre es nulo, 409 si ya existe el nombre.
 */
const create = async (nombre) => {
  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };
  
  const existe = await repo.findByNombre(nombre);
  if (existe) throw { status: 409, message: 'Ya existe un permiso con ese nombre' };
  
  return repo.create(nombre);
};

/**
 * Actualiza el nombre de un permiso.
 * @param {number} id 
 * @param {string} nombre - Nuevo nombre.
 * @throws {Object} 400 si el nombre es vacío, 409 si el nombre ya lo usa otro ID.
 */
const update = async (id, nombre) => {
  await getById(id);
  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };
  
  const dup = await repo.findByNombre(nombre);
  if (dup && dup.id != id) {
    throw { status: 409, message: 'Ya existe un permiso con ese nombre' };
  }
  
  return repo.update(id, nombre);
};

/**
 * Elimina un permiso del sistema.
 * @param {number} id 
 */
const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, create, update, remove };