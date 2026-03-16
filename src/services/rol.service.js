/**
 * @module RolService
 * @description Gestión de roles del sistema. Los roles agrupan permisos y definen el nivel de acceso de los usuarios.
 */

const repo = require('../repositories/rol.repository');

/**
 * @swagger
 * components:
 * schemas:
 * Rol:
 * type: object
 * required:
 * - nombre
 * properties:
 * id:
 * type: integer
 * description: ID único del rol.
 * nombre:
 * type: string
 * description: Nombre del rol (ej. "Administrador", "Vigilante", "Cliente").
 * example:
 * id: 1
 * nombre: "Administrador"
 */

/**
 * Obtiene todos los roles disponibles en el sistema.
 * @returns {Promise<Array>} Lista de roles.
 */
const getAll = () => repo.findAll();

/**
 * Busca un rol por su identificador único.
 * @param {number} id 
 * @throws {Object} 404 si el rol no existe.
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Rol no encontrado' };
  return item;
};

/**
 * Crea un nuevo rol validando que el nombre no esté duplicado.
 * @param {string} nombre - El nombre del nuevo rol.
 * @throws {Object} 400 si el nombre es nulo, 409 si el nombre ya existe.
 */
const create = async (nombre) => {
  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };
  
  const existe = await repo.findByNombre(nombre);
  if (existe) throw { status: 409, message: 'Ya existe un rol con ese nombre' };
  
  return repo.create(nombre);
};

/**
 * Actualiza el nombre de un rol existente.
 * @param {number} id 
 * @param {string} nombre - El nuevo nombre del rol.
 * @throws {Object} 400 si el nombre es nulo, 409 si el nombre ya pertenece a otro rol.
 */
const update = async (id, nombre) => {
  await getById(id);
  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };
  
  const dup = await repo.findByNombre(nombre);
  if (dup && dup.id != id) {
    throw { status: 409, message: 'Ya existe un rol con ese nombre' };
  }
  
  return repo.update(id, nombre);
};

/**
 * Elimina un rol del sistema.
 * @param {number} id 
 */
const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, create, update, remove };