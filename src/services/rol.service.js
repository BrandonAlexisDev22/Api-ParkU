/**
 * @module RolService
 * @description Gestión de roles del sistema. Los roles agrupan permisos y definen el nivel de acceso de los usuarios.
 * Incluye los permisos asociados en las respuestas.
 */

const repo = require('../repositories/rol.repository');

/**
 * @swagger
 * components:
 *   schemas:
 *     Rol:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del rol.
 *         nombre:
 *           type: string
 *           description: Nombre del rol.
 *         permisos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               nombre:
 *                 type: string
 *           description: Lista de permisos asociados (solo lectura).
 *     RolCreate:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         nombre:
 *           type: string
 *     RolUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 */

/**
 * Obtiene todos los roles disponibles en el sistema.
 * @returns {Promise<Array>} Lista de roles con sus permisos.
 */
const getAll = () => repo.findAll();

/**
 * Busca un rol por su identificador único.
 * @param {number} id 
 * @throws {Object} 404 si el rol no existe.
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Rol no encontrado' };
  return item;
};

/**
 * Crea un nuevo rol validando que el nombre no esté duplicado.
 * @param {Object} data - { nombre }
 * @throws {Object} 400 si el nombre es nulo, 409 si el nombre ya existe.
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  const { nombre } = data;
  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };

  const existe = await repo.findByNombre(nombre);
  if (existe) throw { status: 409, message: 'Ya existe un rol con ese nombre' };

  return repo.create({ nombre });
};

/**
 * Actualiza el nombre de un rol existente (actualización parcial).
 * @param {number} id 
 * @param {Object} data - { nombre } (opcional)
 * @throws {Object} 404 si no existe, 400 si el nombre es vacío, 409 si el nombre ya está en uso.
 * @returns {Promise<Object>}
 */
const update = async (id, data) => {
  const rol = await getById(id);

  if (!data.nombre) {
    // Si no se envía nombre, devolver el rol sin cambios
    return rol;
  }

  if (data.nombre.trim() === '') {
    throw { status: 400, message: 'El nombre no puede estar vacío' };
  }

  if (data.nombre !== rol.nombre) {
    const dup = await repo.findByNombre(data.nombre);
    if (dup && dup.id !== id) {
      throw { status: 409, message: 'Ya existe un rol con ese nombre' };
    }
  }

  return repo.update(id, { nombre: data.nombre });
};

/**
 * Elimina un rol del sistema.
 * @param {number} id 
 * @throws {Object} 404 si no existe, 409 si está en uso por algún usuario.
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  await getById(id);
  try {
    return await repo.remove(id);
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw { status: 409, message: 'No se puede eliminar porque está asignado a algún usuario o perfil' };
    }
    throw error;
  }
};

module.exports = { getAll, getById, create, update, remove };