/**
 * @module RolService
 * @description Lógica de negocio para la gestión de roles.
 */

const repo = require('../repositories/rol.repository');
const permisoRepo = require('../repositories/permiso.repository');
const usuarioRepo = require('../repositories/usuario.repository');
const { traducirErrorTrigger } = require('../utils/dbContext.util');
const { ROLES } = require('../config/roles');

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

/**
 * Elimina un rol, con dos barreras de negocio antes de tocar la BD:
 * el rol Administrador nunca se puede eliminar, y ningún rol se puede eliminar
 * mientras tenga usuarios asociados (se debe reasignar/eliminar esos usuarios primero).
 * @param {number|string} id
 * @throws {Object} 400 si el id no es un entero válido; 404 si el rol no existe;
 *   409 si es el rol Administrador o si tiene usuarios asociados.
 */
const remove = async (id) => {
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    throw { status: 400, message: 'El id del rol no es válido' };
  }

  await getById(id); // 404 si no existe

  if (Number(id) === ROLES.ADMIN) {
    throw { status: 409, message: 'El rol Administrador no puede eliminarse' };
  }

  const usuariosAsociados = await usuarioRepo.contarPorRol(id);
  if (usuariosAsociados > 0) {
    throw {
      status: 409,
      message: `El rol tiene ${usuariosAsociados} usuario(s) asociado(s) y no puede eliminarse`,
      data: { usuarios_asociados: usuariosAsociados },
    };
  }

  try {
    return await repo.remove(id);
  } catch (error) {
    traducirErrorTrigger(error);
  }
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