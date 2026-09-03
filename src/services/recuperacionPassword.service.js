/**
 * @module RecuperacionPasswordService
 * @description Flujo de recuperación de contraseña (HU 02.2.3.2): solicitar un token
 * por correo y luego consumirlo para fijar una contraseña nueva. No requiere sesión
 * previa, igual que login/registro.
 *
 * El token que viaja por correo/URL es aleatorio y en claro; en la base de datos solo se
 * guarda su hash SHA-256 (no reversible) -- si alguien lee la tabla `recuperacion_password`
 * (un backup, un dump, un acceso indebido) no puede reconstruir tokens utilizables.
 */

const crypto = require('crypto');
const repo = require('../repositories/recuperacionPassword.repository');
const usuarioRepo = require('../repositories/usuario.repository');
const PasswordUtil = require('../utils/password.util');
const { enviarCorreoRecuperacion } = require('../utils/mailer.util');

const TTL_MINUTOS = parseInt(process.env.RECUPERACION_PASSWORD_TTL_MINUTOS, 10) || 60;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const _hash = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Genera un token de recuperación para el usuario con ese correo, si existe, y lo envía
 * por correo. Responde igual exista o no el correo (evita enumeración de cuentas).
 * @param {string} correo
 * @returns {Promise<void>}
 */
const solicitar = async (correo) => {
  if (!correo) throw { status: 400, message: 'El correo es requerido' };
  if (!EMAIL_REGEX.test(correo)) throw { status: 400, message: 'El correo electrónico no tiene un formato válido' };

  const usuario = await usuarioRepo.findByCorreo(correo);
  if (!usuario) return; // No revelar si la cuenta existe -- ver el controller.

  // Evita que dos solicitudes sucesivas dejen dos tokens simultáneamente válidos.
  await repo.invalidarPendientes(usuario.id);

  const token = crypto.randomBytes(32).toString('hex');
  const fecha_expiracion = new Date(Date.now() + TTL_MINUTOS * 60 * 1000);
  await repo.create({ usuario_id: usuario.id, token_hash: _hash(token), fecha_expiracion });

  const link = `${process.env.FRONTEND_URL || ''}/restablecer-password?token=${token}`;
  await enviarCorreoRecuperacion(usuario.correo, usuario.nombre, link);
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

  const solicitud = await repo.findByTokenHash(_hash(token));
  if (!solicitud) throw { status: 400, message: 'Token inválido' };
  if (solicitud.usado) throw { status: 400, message: 'El token ya fue utilizado' };
  if (new Date(solicitud.fecha_expiracion) < new Date()) {
    throw { status: 400, message: 'El token ha expirado' };
  }

  const contrasena = await PasswordUtil.hash(nuevaContrasena);
  // updateContrasena también fija fecha_cambio_contrasena, que invalida los JWT emitidos
  // antes de este momento -- ver auth.middleware.js verificarToken.
  await usuarioRepo.updateContrasena(solicitud.usuario_id, contrasena);
  await repo.marcarUsado(solicitud.id);
};

module.exports = { solicitar, restablecer };
