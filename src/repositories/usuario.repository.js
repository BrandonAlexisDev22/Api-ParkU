/**
 * @module UsuarioRepository
 * @description Capa de acceso a datos para la tabla 'usuario' usando Sequelize.
 * Incluye el nombre del rol a través de la asociación con 'rol'.
 */

const { Usuario, Rol } = require('../models');

const includeRol = {
  model: Rol,
  as: 'rol',
  attributes: ['nombre'],
};

/**
 * Aplana el resultado de Sequelize para mantener el mismo shape que tenía
 * la versión anterior con SQL manual (rol_nombre plano, sin contraseña).
 * @param {import('sequelize').Model} instancia
 * @returns {Object|null}
 */
const mapUsuario = (instancia) => {
  if (!instancia) return null;
  const plano = instancia.toJSON();
  const { rol, ...resto } = plano;
  return {
    ...resto,
    rol_nombre: rol ? rol.nombre : null,
  };
};

const ATRIBUTOS_PUBLICOS = ['id', 'correo', 'nombre', 'rol_id', 'estado'];

/**
 * Recupera todos los usuarios con el nombre de su rol.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const rows = await Usuario.findAll({
    attributes: ATRIBUTOS_PUBLICOS,
    include: [includeRol],
    order: [['nombre', 'ASC']],
  });
  return rows.map(mapUsuario);
};

/**
 * Busca un usuario por su ID.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const row = await Usuario.findOne({
    where: { id },
    attributes: ATRIBUTOS_PUBLICOS,
    include: [includeRol],
  });
  return mapUsuario(row);
};

/**
 * Busca un usuario por correo (incluye contraseña para login).
 * @param {string} correo
 * @returns {Promise<Object|null>}
 */
const findByCorreo = async (correo) => {
  const row = await Usuario.findOne({ where: { correo } });
  return row ? row.toJSON() : null;
};

/**
 * Busca un usuario por refresh_token.
 * @param {string} refreshToken
 * @returns {Promise<Object|null>}
 */
const findByRefreshToken = async (refreshToken) => {
  const row = await Usuario.findOne({ where: { refresh_token: refreshToken } });
  return row ? row.toJSON() : null;
};

/**
 * Crea un nuevo usuario.
 * @param {Object} data - { correo, nombre, contrasena, rol_id, estado?, refresh_token? }
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  const { correo, nombre, contrasena, rol_id, estado = true, refresh_token = null } = data;
  const nuevo = await Usuario.create({ correo, nombre, contrasena, rol_id, estado, refresh_token });
  return findById(nuevo.id);
};

/**
 * Actualiza parcialmente un usuario.
 * @param {number} id
 * @param {Object} data - Campos a actualizar (todos opcionales)
 * @returns {Promise<Object>}
 */
const update = async (id, data) => {
  const allowedFields = ['correo', 'nombre', 'rol_id', 'estado', 'refresh_token'];
  const cambios = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) cambios[field] = data[field];
  }

  if (Object.keys(cambios).length === 0) {
    return findById(id);
  }

  await Usuario.update(cambios, { where: { id } });
  return findById(id);
};

/**
 * Actualiza la contraseña de un usuario.
 * @param {number} id
 * @param {string} contrasena - Hash de la nueva contraseña
 * @returns {Promise<void>}
 */
const updateContrasena = async (id, contrasena) => {
  await Usuario.update({ contrasena }, { where: { id } });
};

/**
 * Actualiza el refresh_token de un usuario.
 * @param {number} id
 * @param {string|null} refreshToken - Nuevo refresh token o null para eliminarlo
 * @returns {Promise<void>}
 */
const updateRefreshToken = async (id, refreshToken) => {
  await Usuario.update({ refresh_token: refreshToken }, { where: { id } });
};

/**
 * Elimina un usuario.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const filasEliminadas = await Usuario.destroy({ where: { id } });
  return filasEliminadas > 0;
};

module.exports = {
  findAll,
  findById,
  findByCorreo,
  findByRefreshToken,
  create,
  update,
  updateContrasena,
  updateRefreshToken,
  remove,
};
