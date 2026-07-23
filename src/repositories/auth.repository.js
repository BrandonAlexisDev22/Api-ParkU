/**
 * @module AuthRepository
 * @description Persistencia de refresh tokens y tokens de recuperación de contraseña.
 */

const db = require('../config/database');

/* ─── REFRESH TOKENS ───────────────────────────────────────────── */

/**
 * Guarda un refresh token en la BD.
 * @param {number} usuario_id
 * @param {string} token
 */
const saveRefreshToken = async (usuario_id, token) => {
  // Eliminar tokens anteriores del usuario (un token activo por usuario)
  await db.query('DELETE FROM refresh_tokens WHERE usuario_id = ?', [usuario_id]);
  await db.query(
    'INSERT INTO refresh_tokens (usuario_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
    [usuario_id, token]
  );
};

/**
 * Busca un refresh token en la BD.
 * @param {string} token
 * @returns {Promise<Object|null>}
 */
const findRefreshToken = async (token) => {
  const [rows] = await db.query(
    'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
    [token]
  );
  return rows[0] || null;
};

/**
 * Elimina un refresh token (logout).
 * @param {string} token
 */
const deleteRefreshToken = async (token) => {
  await db.query('DELETE FROM refresh_tokens WHERE token = ?', [token]);
};

/* ─── RECUPERACIÓN DE CONTRASEÑA ──────────────────────────────── */

/**
 * Guarda un token de recuperación.
 * @param {number} usuario_id
 * @param {string} token
 */
const saveResetToken = async (usuario_id, token) => {
  await db.query('DELETE FROM password_reset_tokens WHERE usuario_id = ?', [usuario_id]);
  await db.query(
    'INSERT INTO password_reset_tokens (usuario_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
    [usuario_id, token]
  );
};

/**
 * Busca un token de recuperación válido.
 * @param {string} token
 * @returns {Promise<Object|null>}
 */
const findResetToken = async (token) => {
  const [rows] = await db.query(
    'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
    [token]
  );
  return rows[0] || null;
};

/**
 * Elimina el token después de usarlo.
 * @param {string} token
 */
const deleteResetToken = async (token) => {
  await db.query('DELETE FROM password_reset_tokens WHERE token = ?', [token]);
};

module.exports = {
  saveRefreshToken, findRefreshToken, deleteRefreshToken,
  saveResetToken, findResetToken, deleteResetToken
};