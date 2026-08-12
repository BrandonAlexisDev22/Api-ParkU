/**
 * @module RecuperacionPasswordRepository
 * @description Acceso a datos para 'recuperacion_password'. No requiere contexto de
 * usuario (funciona sin sesión previa, como conductor y usuario).
 */

const { RecuperacionPassword } = require('../models');

/**
 * @param {Object} data - { usuario_id, token, fecha_expiracion }
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  const nueva = await RecuperacionPassword.create(data);
  return nueva.toJSON();
};

/**
 * @param {string} token
 * @returns {Promise<Object|null>}
 */
const findByToken = async (token) => {
  const row = await RecuperacionPassword.findOne({ where: { token } });
  return row ? row.toJSON() : null;
};

/**
 * @param {number} id
 * @returns {Promise<void>}
 */
const marcarUsado = async (id) => {
  await RecuperacionPassword.update({ usado: true }, { where: { id } });
};

module.exports = { create, findByToken, marcarUsado };
