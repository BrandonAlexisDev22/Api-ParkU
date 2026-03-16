/**
 * @module ConductorService
 * @description Lógica de negocio para la gestión de perfiles de conductores.
 */

const repo        = require('../repositories/conductor.repository');
const usuarioRepo = require('../repositories/usuario.repository');

/**
 * @swagger
 * components:
 * schemas:
 * Conductor:
 * type: object
 * required:
 * - usuario
 * properties:
 * id:
 * type: integer
 * description: ID único del registro de conductor.
 * usuario:
 * type: integer
 * description: ID del usuario (FK hacia la tabla usuario).
 * perfil:
 * type: string
 * description: Información adicional del perfil del conductor.
 * discapacidad:
 * type: boolean
 * description: Indica si el conductor requiere espacios de parqueo para personas con discapacidad.
 * example:
 * id: 1
 * usuario: 5
 * perfil: "Estudiante de ingeniería"
 * discapacidad: false
 */

/**
 * Obtiene la lista de todos los conductores.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca un conductor por su identificador.
 * @param {number} id - ID del conductor.
 * @throws {Object} 404 si el conductor no existe.
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Conductor no encontrado' };
  return item;
};

/**
 * Crea un nuevo registro de conductor.
 * @param {Object} data - Datos del conductor: { usuario, perfil, discapacidad }.
 * @throws {Object} 400 si falta el usuario, 404 si el usuario no existe, 409 si ya es conductor.
 */
const create = async ({ usuario, perfil, discapacidad }) => {
  if (!usuario) throw { status: 400, message: 'El campo usuario es requerido' };
  
  const usuarioExiste = await usuarioRepo.findById(usuario);
  if (!usuarioExiste) throw { status: 404, message: 'Usuario no encontrado' };
  
  const yaEsConductor = await repo.findByUsuario(usuario);
  if (yaEsConductor) throw { status: 409, message: 'Este usuario ya tiene un perfil de conductor' };
  
  return repo.create({ usuario, perfil, discapacidad });
};

/**
 * Actualiza los datos de un conductor existente.
 * @param {number} id 
 * @param {Object} datos 
 */
const update = async (id, datos) => {
  await getById(id);
  return repo.update(id, datos);
};

/**
 * Elimina un perfil de conductor.
 * @param {number} id 
 */
const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, create, update, remove };