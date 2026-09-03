/**
 * @module RecuperacionPasswordRepository
 * @description Acceso a datos para 'recuperacion_password'. No requiere contexto de
 * usuario (funciona sin sesión previa, como conductor y usuario). Guarda solo el HASH
 * del token -- ver recuperacionPassword.service.js.
 */

const { RecuperacionPassword } = require('../models');

const create = async (data) => {
  const nueva = await RecuperacionPassword.create(data);
  return nueva.toJSON();
};

const findByTokenHash = async (tokenHash) => {
  const row = await RecuperacionPassword.findOne({ where: { token_hash: tokenHash } });
  return row ? row.toJSON() : null;
};

const marcarUsado = async (id) => {
  await RecuperacionPassword.update({ usado: true }, { where: { id } });
};

/**
 * Invalida (marca usado) cualquier token pendiente y no expirado de un usuario, para que
 * al pedir uno nuevo no queden dos tokens simultáneamente válidos.
 * @param {number} usuarioId
 */
const invalidarPendientes = async (usuarioId) => {
  await RecuperacionPassword.update(
    { usado: true },
    { where: { usuario_id: usuarioId, usado: false } },
  );
};

module.exports = { create, findByTokenHash, marcarUsado, invalidarPendientes };
