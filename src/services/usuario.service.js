/**
 * @module UsuarioService
 * @description Gestión de usuarios, autenticación y seguridad.
 * Alineado con el modelo Usuario.
 */

const bcrypt = require('bcryptjs');
const repo = require('../repositories/usuario.repository');

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       required:
 *         - nombre
 *         - correo
 *         - contrasena
 *       properties:
 *         id:
 *           type: integer
 *         nombre:
 *           type: string
 *         correo:
 *           type: string
 *           format: email
 *         contrasena:
 *           type: string
 *           writeOnly: true
 *         numero:
 *           type: string
 *           nullable: true
 *         rol:
 *           type: integer
 *           nullable: true
 *         estado:
 *           type: boolean
 *           default: true
 *         tipoDocumento:
 *           type: string
 *           nullable: true
 *         licencia:
 *           type: string
 *           nullable: true
 *         perfil:
 *           type: integer
 *           nullable: true
 *         rol_nombre:
 *           type: string
 *           description: Nombre del rol (solo lectura)
 *     UsuarioCreate:
 *       type: object
 *       required:
 *         - nombre
 *         - correo
 *         - contrasena
 *       properties:
 *         nombre:
 *           type: string
 *         correo:
 *           type: string
 *           format: email
 *         contrasena:
 *           type: string
 *         numero:
 *           type: string
 *           nullable: true
 *         rol:
 *           type: integer
 *           nullable: true
 *         estado:
 *           type: boolean
 *           default: true
 *         tipoDocumento:
 *           type: string
 *           nullable: true
 *         licencia:
 *           type: string
 *           nullable: true
 *         perfil:
 *           type: integer
 *           nullable: true
 *     UsuarioUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *         correo:
 *           type: string
 *           format: email
 *         numero:
 *           type: string
 *           nullable: true
 *         rol:
 *           type: integer
 *           nullable: true
 *         estado:
 *           type: boolean
 *         tipoDocumento:
 *           type: string
 *           nullable: true
 *         licencia:
 *           type: string
 *           nullable: true
 *         perfil:
 *           type: integer
 *           nullable: true
 */

/**
 * Obtiene todos los usuarios (sin contraseñas).
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca un usuario por ID.
 * @param {number} id 
 * @throws {Object} 404 si no existe.
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Usuario no encontrado' };
  return item;
};

/**
 * Registra un nuevo usuario con contraseña cifrada.
 * @param {Object} data - Datos del usuario (todos los campos)
 * @throws {Object} 400 si faltan campos obligatorios, 409 si correo duplicado.
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  const { nombre, correo, contrasena, numero, rol, estado, tipoDocumento, licencia, perfil } = data;
  if (!nombre || !correo || !contrasena) {
    throw { status: 400, message: 'nombre, correo y contrasena son requeridos' };
  }

  const existe = await repo.findByCorreo(correo);
  if (existe) throw { status: 409, message: 'El correo ya está registrado' };

  const hash = await bcrypt.hash(contrasena, 10);
  return repo.create({
    nombre,
    correo,
    contrasena: hash,
    numero,
    rol,
    estado: estado !== undefined ? estado : true,
    tipoDocumento,
    licencia,
    perfil
  });
};

/**
 * Actualiza parcialmente un usuario.
 * @param {number} id 
 * @param {Object} data - Campos a actualizar
 * @throws {Object} 404 si no existe, 409 si correo duplicado.
 * @returns {Promise<Object>}
 */
const update = async (id, data) => {
  const usuario = await getById(id);

  // Si se actualiza el correo, verificar que no esté en uso por otro usuario
  if (data.correo && data.correo !== usuario.correo) {
    const duplicado = await repo.findByCorreo(data.correo);
    if (duplicado && duplicado.id !== id) {
      throw { status: 409, message: 'El correo ya está registrado por otro usuario' };
    }
  }

  // Si se actualiza la contraseña (no se permite en este método, solo en cambiarContrasena)
  if (data.contrasena) {
    throw { status: 400, message: 'Para cambiar la contraseña use el endpoint específico' };
  }

  return repo.update(id, data);
};

/**
 * Cambia la contraseña verificando la anterior.
 * @param {number} id 
 * @param {Object} passwordData - { actual, nueva }
 * @throws {Object} 400 si faltan datos, 401 si actual incorrecta.
 * @returns {Promise<void>}
 */
const cambiarContrasena = async (id, { actual, nueva }) => {
  if (!actual || !nueva) {
    throw { status: 400, message: 'actual y nueva son requeridos' };
  }

  const usuario = await repo.findById(id);
  if (!usuario) throw { status: 404, message: 'Usuario no encontrado' };

  // Obtener el usuario completo (con contraseña) para validar
  const usuarioCompleto = await repo.findByCorreo(usuario.correo);
  const ok = await bcrypt.compare(actual, usuarioCompleto.contrasena);
  if (!ok) throw { status: 401, message: 'Contraseña actual incorrecta' };

  const hash = await bcrypt.hash(nueva, 10);
  await repo.updateContrasena(id, hash);
};

/**
 * Elimina un usuario.
 * @param {number} id 
 * @throws {Object} 404 si no existe.
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

/**
 * Valida credenciales de acceso (login).
 * @param {string} correo 
 * @param {string} contrasena 
 * @returns {Promise<Object>} Datos del usuario (sin contraseña).
 * @throws {Object} 400 si faltan campos, 401 si credenciales inválidas.
 */
const login = async (correo, contrasena) => {
  if (!correo || !contrasena) {
    throw { status: 400, message: 'correo y contrasena son requeridos' };
  }

  const usuario = await repo.findByCorreo(correo);
  if (!usuario) throw { status: 401, message: 'Credenciales inválidas' };

  const ok = await bcrypt.compare(contrasena, usuario.contrasena);
  if (!ok) throw { status: 401, message: 'Credenciales inválidas' };

  // Eliminar la contraseña del objeto devuelto
  const { contrasena: _, ...datos } = usuario;
  return datos;
};

module.exports = { getAll, getById, create, update, cambiarContrasena, remove, login };