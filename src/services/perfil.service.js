/**
 * @module PerfilService
 * @description Lógica de negocio para la gestión de perfiles.
 */

const repo = require('../repositories/perfil.repository');

/**
 * Obtiene todos los perfiles.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca un perfil por ID.
 * @param {number} id
 * @throws {Object} 404 si no existe.
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Perfil no encontrado' };
  return item;
};

/**
 * Crea un nuevo perfil validando unicidad del nombre.
 * @param {Object} data - { nombre, descripcion }
 * @throws {Object} 400 si falta nombre, 409 si ya existe.
 * @returns {Promise<Object>}
 */
const create = async ({ nombre, descripcion }) => {
  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };

  const existe = await repo.findByNombre(nombre);
  if (existe) throw { status: 409, message: 'Ya existe un perfil con ese nombre' };

  return repo.create({ nombre, descripcion });
};

/**
 * Actualiza un perfil (parcial).
 * @param {number} id
 * @param {Object} data - { nombre, descripcion }
 * @throws {Object} 404 si no existe, 409 si el nuevo nombre ya está en uso.
 * @returns {Promise<Object>}
 */
const update = async (id, data) => {
  const perfil = await getById(id);

  if (data.nombre && data.nombre !== perfil.nombre) {
    const duplicado = await repo.findByNombre(data.nombre);
    if (duplicado && duplicado.id !== id) {
      throw { status: 409, message: 'Ya existe otro perfil con ese nombre' };
    }
  }

  return repo.update(id, data);
};

/**
 * Elimina un perfil.
 * @param {number} id
 * @throws {Object} 404 si no existe, 409 si está en uso.
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  await getById(id);
  // Nota: Si hay integridad referencial, el repositorio lanzará un error SQL.
  // Se puede capturar y lanzar 409.
  try {
    return await repo.remove(id);
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw { status: 409, message: 'No se puede eliminar porque está en uso por conductores o usuarios' };
    }
    throw error;
  }
};

module.exports = { getAll, getById, create, update, remove };