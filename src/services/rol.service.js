/**
 * @module RolService
 * @description Lógica de negocio para la gestión de roles.
 */

const repo = require('../repositories/rol.repository');
const permisoRepo = require('../repositories/permiso.repository');

const getAll = () => repo.findAll();

const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Rol no encontrado' };
  return item;
};

const create = async ({ nombre }) => {
  if (!nombre) throw { status: 400, message: 'El nombre del rol es requerido' };
  return repo.create({ nombre });
};

const update = async (id, data) => {
  await getById(id); // valida existencia
  if (!data.nombre) {
    throw { status: 400, message: 'El nombre del rol es requerido' };
  }
  return repo.update(id, data);
};

const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

/**
 * Asigna un permiso a un rol, validando que ambos existan.
 * @param {number} rolId
 * @param {number} permisoId
 */
const asignarPermiso = async (rolId, permisoId) => {
  await getById(rolId); // valida rol
  const permiso = await permisoRepo.findById(permisoId);
  if (!permiso) throw { status: 404, message: 'Permiso no encontrado' };
  await repo.asignarPermiso(rolId, permisoId);
  return getById(rolId); // devuelve el rol actualizado con sus permisos
};

/**
 * Quita un permiso de un rol.
 * @param {number} rolId
 * @param {number} permisoId
 */
const quitarPermiso = async (rolId, permisoId) => {
  await getById(rolId);
  await repo.quitarPermiso(rolId, permisoId);
  return getById(rolId);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  asignarPermiso,
  quitarPermiso,
};