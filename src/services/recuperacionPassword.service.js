/**
 * @module RecuperacionPasswordService
 * @description Flujo de recuperación de contraseña (HU 02.2.3.2): solicitar un token
 * por correo y luego consumirlo para fijar una contraseña nueva. No requiere sesión
 * previa, igual que login/registro.
 */

const crypto = require('crypto');
const repo = require('../repositories/recuperacionPassword.repository');
const usuarioRepo = require('../repositories/usuario.repository');
const PasswordUtil = require('../utils/password.util');

const TTL_MINUTOS = parseInt(process.env.RECUPERACION_PASSWORD_TTL_MINUTOS, 10) || 60;

/**
 * Genera un token de recuperación para el usuario con ese correo, si existe.
 * Responde igual exista o no el correo (evita enumeración de cuentas); el token
 * solo se genera y se guarda cuando sí existe.
 * @param {string} correo
 * @returns {Promise<{ token: string|null }>} El token solo viaja en la respuesta
 *   fuera de producción (no hay servicio de correo integrado todavía); en
 *   producción debe enviarse por correo y no exponerse en la API.
 */
const solicitar = async (correo) => {
  if (!correo) throw { status: 400, message: 'El correo es requerido' };

  const usuario = await usuarioRepo.findByCorreo(correo);
  if (!usuario) return { token: null };

  const token = crypto.randomBytes(32).toString('hex');
  const fecha_expiracion = new Date(Date.now() + TTL_MINUTOS * 60 * 1000);

  await repo.create({ usuario_id: usuario.id, token, fecha_expiracion });

  const exponerToken = process.env.NODE_ENV !== 'production';
  return { token: exponerToken ? token : null };
};

/**
 * Consume un token de recuperación y fija la nueva contraseña.
 * @param {string} token
 * @param {string} nuevaContrasena
 * @throws {Object} 400 si faltan datos, el token es inválido, ya se usó o expiró.
 * @returns {Promise<void>}
 */
const restablecer = async (token, nuevaContrasena) => {
  if (!token || !nuevaContrasena) {
    throw { status: 400, message: 'token y nuevaContrasena son requeridos' };
  }
  if (nuevaContrasena.length < 8) {
    throw { status: 400, message: 'La nueva contraseña debe tener al menos 8 caracteres' };
  }

  const solicitud = await repo.findByToken(token);
  if (!solicitud) throw { status: 400, message: 'Token inválido' };
  if (solicitud.usado) throw { status: 400, message: 'El token ya fue utilizado' };
  if (new Date(solicitud.fecha_expiracion) < new Date()) {
    throw { status: 400, message: 'El token ha expirado' };
  }

  const contrasena = await PasswordUtil.hash(nuevaContrasena);
  await usuarioRepo.updateContrasena(solicitud.usuario_id, contrasena);
  await repo.marcarUsado(solicitud.id);
};

module.exports = { solicitar, restablecer };
