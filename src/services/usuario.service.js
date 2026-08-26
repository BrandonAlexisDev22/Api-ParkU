/**
 * @module UsuarioService
 * @description Gestión de usuarios, autenticación y seguridad.
 * Alineado con el modelo Usuario.
 */

const bcrypt = require('bcryptjs');
const repo = require('../repositories/usuario.repository');

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
  const { nombre, correo, contrasena, rol, estado, numero_telefonico } = data;

  if (!nombre || !correo || !contrasena) {
    throw { status: 400, message: 'nombre, correo y contrasena son requeridos' };
  }

  const existe = await repo.findByCorreo(correo);
  if (existe) throw { status: 409, message: 'El correo ya está registrado' };

  if (numero_telefonico) {
    const telefonoEnUso = await repo.findByTelefono(numero_telefonico);
    if (telefonoEnUso) throw { status: 409, message: 'Este número de teléfono ya está registrado en otra cuenta' };
  }

  const hash = await bcrypt.hash(contrasena, 10);

  return repo.create({
    nombre,
    correo,
    contrasena: hash,
    rol_id: rol || 3,
    estado: estado !== undefined ? estado : true,
    numero_telefonico: numero_telefonico || null,
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

  // Igual chequeo para el teléfono de la cuenta
  if (data.numero_telefonico && data.numero_telefonico !== usuario.numero_telefonico) {
    const duplicado = await repo.findByTelefono(data.numero_telefonico);
    if (duplicado && duplicado.id !== id) {
      throw { status: 409, message: 'Este número de teléfono ya está registrado en otra cuenta' };
    }
  }

  // Si se actualiza la contraseña (no se permite en este método, solo en cambiarContrasena)
  if (data.contrasena) {
    throw { status: 400, message: 'Para cambiar la contraseña use el endpoint específico' };
  }

  // ✅ CORREGIDO: Mapear 'rol' a 'rol_id' si viene en los datos
  const updateData = { ...data };
  if (updateData.rol !== undefined) {
    updateData.rol_id = updateData.rol;
    delete updateData.rol;
  }

  return repo.update(id, updateData);
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