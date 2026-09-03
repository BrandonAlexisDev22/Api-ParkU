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

const ATRIBUTOS_PUBLICOS = ['id', 'correo', 'nombre', 'numero_telefonico', 'rol_id', 'estado', 'foto_perfil_url', 'correo_verificado', 'ultimo_acceso', 'fecha_creacion'];

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
 * @param {import('sequelize').Transaction} [opciones.transaction] - Pasarla cuando se
 *   llama justo después de un create en la misma transacción: si no, esta lectura sale
 *   por otra conexión del pool y no ve la fila todavía sin confirmar (queda en null).
 * @returns {Promise<Object|null>}
 */
const findById = async (id, { transaction } = {}) => {
  const row = await Usuario.findOne({
    where: { id },
    attributes: ATRIBUTOS_PUBLICOS,
    include: [includeRol],
    transaction,
  });
  return mapUsuario(row);
};

/**
 * Busca un usuario por correo (incluye contraseña, para login).
 * @param {string} correo
 * @returns {Promise<Object|null>}
 */
const findByCorreo = async (correo) => {
  const row = await Usuario.findOne({ where: { correo } });
  return row ? row.toJSON() : null;
};

/**
 * Busca un usuario por número de teléfono de la cuenta (para chequeo de duplicados).
 * @param {string} numeroTelefonico
 * @returns {Promise<Object|null>}
 */
const findByTelefono = async (numeroTelefonico) => {
  const row = await Usuario.findOne({ where: { numero_telefonico: numeroTelefonico } });
  return row ? row.toJSON() : null;
};

/**
 * Crea un nuevo usuario.
 * @param {Object} data - { correo, nombre, contrasena, rol_id, estado?, numero_telefonico? }
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<Object>}
 */
const create = async (data, { transaction } = {}) => {
  const { correo, nombre, contrasena, rol_id, estado = 'ACTIVO', numero_telefonico = null } = data;
  const nuevo = await Usuario.create({ correo, nombre, contrasena, rol_id, estado, numero_telefonico }, { transaction });
  return findById(nuevo.id, { transaction });
};

/**
 * Actualiza parcialmente un usuario.
 * @param {number} id
 * @param {Object} data - Campos a actualizar (todos opcionales)
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<Object>}
 */
const update = async (id, data, { transaction } = {}) => {
  const allowedFields = ['correo', 'nombre', 'rol_id', 'estado', 'numero_telefonico', 'foto_perfil_url', 'correo_verificado'];
  const cambios = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) cambios[field] = data[field];
  }

  if (Object.keys(cambios).length === 0) {
    return findById(id, { transaction });
  }

  await Usuario.update(cambios, { where: { id }, transaction });
  return findById(id, { transaction });
};

/**
 * Actualiza la contraseña de un usuario. También marca fecha_cambio_contrasena, que
 * invalida cualquier JWT emitido antes de este momento -- ver
 * auth.middleware.js verificarToken.
 * @param {number} id
 * @param {string} contrasena - Hash de la nueva contraseña
 * @returns {Promise<void>}
 */
const updateContrasena = async (id, contrasena) => {
  await Usuario.update({ contrasena, fecha_cambio_contrasena: new Date() }, { where: { id } });
};

/**
 * Registra un intento de login fallido; bloquea la cuenta tras `maxIntentos`.
 * @param {number} id
 * @param {number} maxIntentos
 * @returns {Promise<{ intentos_fallidos: number, estado: string }>}
 */
const registrarLoginFallido = async (id, maxIntentos = 5) => {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) return null;
  const intentos = usuario.intentos_fallidos + 1;
  const estado = intentos >= maxIntentos ? 'BLOQUEADO' : usuario.estado;
  await usuario.update({ intentos_fallidos: intentos, estado });
  return { intentos_fallidos: intentos, estado };
};

/**
 * Registra un login exitoso: limpia intentos fallidos y marca último acceso.
 * @param {number} id
 * @returns {Promise<void>}
 */
const registrarLoginExitoso = async (id) => {
  await Usuario.update(
    { intentos_fallidos: 0, ultimo_acceso: new Date() },
    { where: { id } }
  );
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

/**
 * Cuenta cuántos usuarios tienen asignado un rol -- usado para bloquear el borrado
 * de un rol que todavía tiene usuarios asociados.
 * @param {number} rolId
 * @returns {Promise<number>}
 */
const contarPorRol = (rolId) => Usuario.count({ where: { rol_id: rolId } });

module.exports = {
  findAll,
  findById,
  findByCorreo,
  findByTelefono,
  create,
  update,
  updateContrasena,
  registrarLoginFallido,
  registrarLoginExitoso,
  remove,
  contarPorRol,
};
