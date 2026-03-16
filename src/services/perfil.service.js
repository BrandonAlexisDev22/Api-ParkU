/**
 * @module PerfilService
 * @description Gestión de perfiles de usuario. Define las categorías que determinan permisos o tipos de cuenta.
 */

const repo = require('../repositories/perfil.repository');

/**
 * @swagger
 * components:
 * schemas:
 * Perfil:
 * type: object
 * required:
 * - nombre
 * properties:
 * id:
 * type: integer
 * description: ID único del perfil.
 * nombre:
 * type: string
 * description: Nombre del perfil (ej. Estudiante, Docente, Externo).
 * descripcion:
 * type: string
 * description: Breve explicación de lo que implica este perfil.
 * example:
 * id: 1
 * nombre: "Estudiante"
 * descripcion: "Usuario con vínculo académico activo"
 */

/**
 * Obtiene todos los perfiles registrados en el sistema.
 * @returns {Promise<Array>} Lista de perfiles.
 */
const getAll = () => repo.findAll();

/**
 * Busca un perfil por su ID.
 * @param {number} id 
 * @throws {Object} 404 si el perfil no existe.
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Perfil no encontrado' };
  return item;
};

/**
 * Crea un nuevo perfil.
 * @param {Object} data - { nombre, descripcion }
 * @throws {Object} 400 si el nombre es nulo o vacío.
 */
const create = async ({ nombre, descripcion }) => {
  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };
  return repo.create({ nombre, descripcion });
};

/**
 * Actualiza un perfil existente.
 * @param {number} id 
 * @param {Object} datos - { nombre, descripcion }
 * @throws {Object} 400 si se intenta dejar el nombre vacío.
 */
const update = async (id, datos) => {
  await getById(id);
  if (!datos.nombre) throw { status: 400, message: 'El nombre es requerido' };
  return repo.update(id, datos);
};

/**
 * Elimina un perfil del sistema.
 * @param {number} id 
 */
const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, create, update, remove };