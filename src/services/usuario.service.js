/**
 * @module UsuarioService
 * @description Gestión de usuarios, autenticación y seguridad. 
 * Implementa cifrado de contraseñas con bcryptjs.
 */

const bcrypt = require('bcryptjs');
const repo   = require('../repositories/usuario.repository');

/**
 * @swagger
 * components:
 * schemas:
 * Usuario:
 * type: object
 * required:
 * - correo
 * - contrasena
 * - nombre
 * properties:
 * id:
 * type: integer
 * description: ID único del usuario.
 * correo:
 * type: string
 * format: email
 * description: Correo electrónico (identificador de login).
 * contrasena:
 * type: string
 * description: Contraseña cifrada (solo escritura).
 * nombre:
 * type: string
 * description: Nombre completo del usuario.
 * numero:
 * type: string
 * description: Número de teléfono/contacto.
 * rol:
 * type: integer
 * description: ID del rol asignado.
 * example:
 * id: 1
 * correo: "admin@parku.com"
 * nombre: "Admin ParkU"
 * numero: "3001234567"
 * rol: 1
 */

/**
 * Obtiene todos los usuarios (sin incluir contraseñas).
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca un usuario por ID.
 * @param {number} id 
 * @throws {Object} 404 si el usuario no existe.
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Usuario no encontrado' };
  return item;
};

/**
 * Registra un nuevo usuario con contraseña cifrada.
 * @param {Object} data - { correo, contrasena, nombre, numero, rol }
 * @throws {Object} 400 datos faltantes, 409 correo duplicado.
 */
const create = async ({ correo, contrasena, nombre, numero, rol }) => {
  if (!correo || !contrasena || !nombre)
    throw { status: 400, message: 'correo, contrasena y nombre son requeridos' };
    
  const existe = await repo.findByCorreo(correo);
  if (existe) throw { status: 409, message: 'El correo ya está registrado' };
  
  const hash = await bcrypt.hash(contrasena, 10);
  return repo.create({ correo, contrasena: hash, nombre, numero, rol });
};

/**
 * Actualiza la información básica de un usuario.
 * @param {number} id 
 * @param {Object} datos 
 */
const update = async (id, datos) => {
  await getById(id);
  return repo.update(id, datos);
};

/**
 * Cambia la contraseña verificando la anterior.
 * @param {number} id 
 * @param {Object} passwordData - { actual, nueva }
 * @throws {Object} 401 si la contraseña actual no coincide.
 */
const cambiarContrasena = async (id, { actual, nueva }) => {
  if (!actual || !nueva) throw { status: 400, message: 'actual y nueva son requeridos' };
  
  const usuario = await repo.findByCorreo((await getById(id)).correo);
  const ok = await bcrypt.compare(actual, usuario.contrasena);
  
  if (!ok) throw { status: 401, message: 'Contraseña actual incorrecta' };
  
  const hash = await bcrypt.hash(nueva, 10);
  await repo.updateContrasena(id, hash);
};

/**
 * Elimina un usuario.
 * @param {number} id 
 */
const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

/**
 * Valida credenciales de acceso.
 * @param {string} correo 
 * @param {string} contrasena 
 * @returns {Promise<Object>} Datos del usuario (sin contraseña).
 * @throws {Object} 401 si las credenciales son erróneas.
 */
const login = async (correo, contrasena) => {
  if (!correo || !contrasena)
    throw { status: 400, message: 'correo y contrasena son requeridos' };
    
  const usuario = await repo.findByCorreo(correo);
  if (!usuario) throw { status: 401, message: 'Credenciales inválidas' };
  
  const ok = await bcrypt.compare(contrasena, usuario.contrasena);
  if (!ok) throw { status: 401, message: 'Credenciales inválidas' };
  
  // Extraemos la contraseña para no devolverla en el objeto de sesión
  const { contrasena: _, ...datos } = usuario;
  return datos;
};

module.exports = { getAll, getById, create, update, cambiarContrasena, remove, login };