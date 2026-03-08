/**
 * @module usuariosRepository
 * @description
 * Repository encargado de manejar el acceso a los datos de usuarios.
 * Aquí se realizan las operaciones CRUD sobre la fuente de datos.
 *
 * Flujo de arquitectura:
 * Controller → Service → Repository → Base de Datos
 */

const Usuario = require('../models/usuarios.models');

let usuarios = [];
let idCounter = 1;

/**
 * Crear un usuario
 *
 * @function create
 * @memberof module:usuariosRepository
 *
 * @param {Object} data - Datos del usuario
 * @returns {Object} Usuario creado
 */
const create = (data) => {
  const usuario = new Usuario(
    idCounter++,
    data.nombre,
    data.correo,
    data.password,
    data.rol_id,
    true
  );

  usuarios.push(usuario);
  return usuario;
};


/**
 * Obtener todos los usuarios
 *
 * @function getAll
 * @memberof module:usuariosRepository
 *
 * @returns {Array<Object>} Lista de usuarios
 */
const getAll = () => usuarios;


/**
 * Obtener usuario por ID
 *
 * @function getById
 * @memberof module:usuariosRepository
 *
 * @param {number} id - ID del usuario
 * @returns {Object|null} Usuario encontrado
 */
const getById = (id) => {
  return usuarios.find(u => u.id_usuario === id);
};


/**
 * Obtener usuario por correo
 *
 * @function getByCorreo
 * @memberof module:usuariosRepository
 *
 * @param {string} correo - Correo del usuario
 * @returns {Object|null} Usuario encontrado
 */
const getByCorreo = (correo) => {
  return usuarios.find(u => u.correo === correo);
};


/**
 * Editar usuario por ID
 *
 * @function editById
 * @memberof module:usuariosRepository
 *
 * @param {number} id - ID del usuario
 * @param {Object} data - Nuevos datos
 * @returns {Object} Usuario actualizado
 */
const editById = (id, data) => {

  const usuario = getById(id);

  if (!usuario) return null;

  usuario.nombre = data.nombre ?? usuario.nombre;
  usuario.correo = data.correo ?? usuario.correo;
  usuario.password = data.password ?? usuario.password;
  usuario.rol_id = data.rol_id ?? usuario.rol_id;

  return usuario;
};


/**
 * Eliminar usuario por ID
 *
 * @function deleteById
 * @memberof module:usuariosRepository
 *
 * @param {number} id - ID del usuario
 * @returns {Object|null} Usuario eliminado
 */
const deleteById = (id) => {

  const index = usuarios.findIndex(u => u.id_usuario === id);

  if (index === -1) return null;

  const deleted = usuarios[index];
  usuarios.splice(index, 1);

  return deleted;
};


module.exports = {
  create,
  getAll,
  getById,
  getByCorreo,
  editById,
  deleteById
};