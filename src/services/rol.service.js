/**
 * @module RolService
 * @description Lógica de negocio para la gestión de roles.
 */

const repo = require('../repositories/rol.repository');
const permisoRepo = require('../repositories/permiso.repository');
const usuarioRepo = require('../repositories/usuario.repository');
const { traducirErrorTrigger } = require('../utils/dbContext.util');
const { ROLES } = require('../config/roles');
const { invalidarCachePermisos } = require('../middlewares/auth.middleware');

const getAll = () => repo.findAll();

const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Rol no encontrado' };
  return item;
};

/**
 * Normaliza y valida una lista de permisos: acepta ids sueltos o el arreglo de objetos
 * {id, nombre} que devuelve la propia API (así el frontend puede reenviar lo que leyó sin
 * transformarlo), quita repetidos y comprueba que todos existan.
 * @private
 * @param {Array<number|string|{id:number}>} permisos
 * @throws {Object} 400 si no es un arreglo o trae ids no numéricos; 404 si algún permiso no existe.
 * @returns {Promise<number[]>}
 */
const _normalizarPermisos = async (permisos) => {
  if (!Array.isArray(permisos)) {
    throw { status: 400, message: 'permisos debe ser un arreglo de identificadores' };
  }

  const ids = [...new Set(permisos.map((p) => Number(p && typeof p === 'object' ? p.id : p)))];
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw { status: 400, message: 'permisos solo admite identificadores numéricos' };
  }

  const encontrados = await Promise.all(ids.map((id) => permisoRepo.findById(id)));
  const inexistentes = ids.filter((_, i) => !encontrados[i]);
  if (inexistentes.length) {
    throw { status: 404, message: `Permiso(s) no encontrado(s): ${inexistentes.join(', ')}` };
  }
  return ids;
};

/**
 * El rol Administrador es el rol protegido del sistema: no se elimina (ver remove) y
 * tampoco se le pueden recortar permisos. Sin esta barrera, un administrador podría
 * quitarle a su propio rol el permiso de configuración y dejar el sistema sin nadie capaz
 * de volver a otorgarlo -- un bloqueo irreversible desde la API.
 * @private
 * @param {number} rolId
 * @param {number[]} permisosNuevos
 * @throws {Object} 409 si se intenta quitarle permisos al rol Administrador.
 */
const _protegerRolAdmin = async (rolId, permisosNuevos) => {
  if (Number(rolId) !== ROLES.ADMIN) return;

  const todos = await permisoRepo.findAll();
  const faltantes = todos.filter((p) => !permisosNuevos.includes(p.id));
  if (faltantes.length) {
    throw {
      status: 409,
      message: 'El rol Administrador está protegido: no se le pueden retirar permisos, porque nadie más podría volver a otorgarlos',
      data: { permisos_que_se_intentaban_retirar: faltantes.map((p) => p.nombre) },
    };
  }
};

/**
 * Crea un rol, opcionalmente con sus permisos ya asignados.
 *
 * Antes solo aceptaba `nombre`: el rol nacía sin ningún permiso y había que ir
 * asignándolos de a uno con llamadas aparte, así que un rol recién creado no servía para
 * nada hasta completar ese segundo paso (y si se olvidaba, quedaba mudo).
 * @param {Object} data - { nombre, descripcion?, estado?, permisos? }
 * @throws {Object} 400 si falta el nombre o los permisos vienen mal formados; 404 si algún permiso no existe.
 * @returns {Promise<Object>} El rol creado, con sus permisos.
 */
const create = async ({ nombre, descripcion, estado, permisos }) => {
  if (!nombre) throw { status: 400, message: 'El nombre del rol es requerido' };

  const ids = permisos === undefined ? [] : await _normalizarPermisos(permisos);

  const creado = await repo.create({ nombre, descripcion, estado });
  if (!ids.length) return creado;

  return repo.reemplazarPermisos(creado.id, ids);
};

/**
 * Actualiza un rol. Si el cuerpo trae `permisos`, ese arreglo pasa a ser el conjunto
 * COMPLETO de permisos del rol (los que no estén se retiran), que es lo que necesita una
 * pantalla de edición con casillas.
 * @param {number} id
 * @param {Object} data - { nombre, descripcion?, estado?, permisos? }
 * @throws {Object} 400 si falta el nombre; 404 si el rol o algún permiso no existe; 409 si se intenta recortar el rol Administrador.
 * @returns {Promise<Object>}
 */
const update = async (id, data) => {
  await getById(id); // valida existencia
  if (!data.nombre) {
    throw { status: 400, message: 'El nombre del rol es requerido' };
  }

  const actualizado = await repo.update(id, data);
  if (data.permisos === undefined) return actualizado;

  return reemplazarPermisos(id, data.permisos);
};

/**
 * Fija el conjunto completo de permisos de un rol.
 * @param {number} id
 * @param {Array<number|{id:number}>} permisos
 * @throws {Object} 404 si el rol o algún permiso no existe; 409 si es el rol Administrador y se le recortan permisos.
 * @returns {Promise<Object>} El rol con sus permisos actualizados.
 */
const reemplazarPermisos = async (id, permisos) => {
  await getById(id);
  const ids = await _normalizarPermisos(permisos);
  await _protegerRolAdmin(id, ids);
  const actualizado = await repo.reemplazarPermisos(id, ids);
  // Sin esto, quien ya tuviera sesión abierta seguiría con los permisos viejos hasta que
  // caducara la caché: dar o quitar un permiso tiene que notarse en la siguiente petición.
  invalidarCachePermisos(id);
  return actualizado;
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
  invalidarCachePermisos(rolId);
  return getById(rolId); // devuelve el rol actualizado con sus permisos
};

/**
 * Quita un permiso de un rol.
 * @param {number} rolId
 * @param {number} permisoId
 */
const quitarPermiso = async (rolId, permisoId) => {
  const rol = await getById(rolId);
  // Misma protección que reemplazarPermisos, por la vía de a uno.
  const restantes = (rol.permisos || []).map((p) => p.id).filter((id) => id !== Number(permisoId));
  await _protegerRolAdmin(rolId, restantes);
  await repo.quitarPermiso(rolId, permisoId);
  invalidarCachePermisos(rolId);
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
  reemplazarPermisos,
};