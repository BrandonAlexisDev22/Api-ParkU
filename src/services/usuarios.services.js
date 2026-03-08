/**
 * @module usuariosService
 * @description
 * Service encargado de manejar la lógica de negocio de los usuarios
 * dentro de la arquitectura MVC.
 *
 * Responsabilidades:
 * - Aplicar reglas de negocio
 * - Validar datos antes de enviarlos al repositorio
 * - Comunicarse con el Repository para acceder a la base de datos
 *
 * Flujo:
 * Controller → Service → Repository → Base de Datos
 */

// Importa el repository encargado del acceso a datos
const usuarioRepository = require('../repositories/usuarios.repository');

/**
 * Crear un nuevo usuario
 *
 * Regla de negocio:
 * No se puede crear un usuario con un correo que ya exista.
 *
 * @function createUsuario
 * @memberof module:usuariosService
 *
 * @param {Object} data - Datos del usuario a crear
 * @param {string} data.nombre - Nombre del usuario
 * @param {string} data.correo - Correo del usuario
 * @param {string} data.password - Contraseña del usuario
 * @param {number} data.rol_id - ID del rol del usuario
 *
 * @returns {Object} Usuario creado
 * @throws {Error} Si el correo ya existe
 */
const createUsuario = (data) => {

  const existing = usuarioRepository.getByCorreo(data.correo);

  if (existing) {
    throw new Error('El usuario con ese correo ya existe');
  }

  return usuarioRepository.create(data);
};

/**
 * Obtener todos los usuarios
 *
 * @function getUsuarios
 * @memberof module:usuariosService
 *
 * @returns {Array<Object>} Lista de usuarios
 */
const getUsuarios = () => usuarioRepository.getAll();


/**
 * Editar un usuario existente
 *
 * Regla de negocio:
 * - El usuario debe existir
 * - El correo no puede duplicarse
 *
 * @function editUsuario
 * @memberof module:usuariosService
 *
 * @param {number} id - ID del usuario a editar
 * @param {Object} data - Nuevos datos del usuario
 * @param {string} data.nombre - Nombre del usuario
 * @param {string} data.correo - Correo del usuario
 * @param {number} data.rol_id - Rol del usuario
 *
 * @returns {Object} Usuario actualizado
 * @throws {Error} Si el usuario no existe
 * @throws {Error} Si el correo ya está en uso
 */
const editUsuario = (id, data) => {

  const usuarioExisting = usuarioRepository.getById(id);

  if (!usuarioExisting) {
    throw new Error("El usuario no existe");
  }

  const duplicateCorreo = usuarioRepository.getByCorreo(data.correo);

  if (duplicateCorreo && duplicateCorreo.id_usuario !== id) {
    throw new Error("Ya existe un usuario con ese correo");
  }

  return usuarioRepository.editById(id, data);
};


/**
 * Eliminar un usuario por su ID
 *
 * Regla de negocio:
 * - El usuario debe existir antes de eliminarse
 *
 * @function deleteUsuarioById
 * @memberof module:usuariosService
 *
 * @param {number} id - ID del usuario a eliminar
 * @returns {Object} Usuario eliminado
 * @throws {Error} Si el usuario no existe
 */
const deleteUsuarioById = (id) => {

  const usuarioExisting = usuarioRepository.getById(id);

  if (!usuarioExisting) {
    throw new Error("El usuario no existe");
  }

  return usuarioRepository.deleteById(id);
};

module.exports = {
  createUsuario,
  getUsuarios,
  editUsuario,
  deleteUsuarioById
};