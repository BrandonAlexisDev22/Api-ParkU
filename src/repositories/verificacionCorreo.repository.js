/**
 * @module VerificacionCorreoRepository
 * @description Acceso a datos para 'verificacion_correo'. Guarda solo el HASH del token
 * -- ver verificacionCorreo.service.js. No requiere contexto de usuario (se usa recién
 * creada la cuenta, antes de cualquier sesión).
 */

const { VerificacionCorreo } = require('../models');

const create = async (data) => {
  const nueva = await VerificacionCorreo.create(data);
  return nueva.toJSON();
};

const findByTokenHash = async (tokenHash) => {
  const row = await VerificacionCorreo.findOne({ where: { token_hash: tokenHash } });
  return row ? row.toJSON() : null;
};

const marcarUsado = async (id) => {
  await VerificacionCorreo.update({ usado: true }, { where: { id } });
};

/**
 * Invalida (marca usado) cualquier token pendiente y no expirado de un usuario, para que
 * un reenvío no deje dos tokens simultáneamente válidos.
 * @param {number} usuarioId
 */
const invalidarPendientes = async (usuarioId) => {
  await VerificacionCorreo.update(
    { usado: true },
    { where: { usuario_id: usuarioId, usado: false } },
  );
};

module.exports = { create, findByTokenHash, marcarUsado, invalidarPendientes };
