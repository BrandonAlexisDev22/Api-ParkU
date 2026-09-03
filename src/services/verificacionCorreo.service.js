/**
 * @module VerificacionCorreoService
 * @description Verificación de correo tras el registro. Distingue "correo con formato
 * válido" (una regex no puede probar más que eso) de "correo verificado" (el dueño de la
 * cuenta efectivamente recibió y abrió un enlace enviado a esa dirección).
 *
 * Mismo patrón de seguridad que recuperacionPassword.service.js: el token que viaja por
 * correo es aleatorio y en claro; solo su hash SHA-256 se guarda en BD.
 */

const crypto = require('crypto');
const repo = require('../repositories/verificacionCorreo.repository');
const usuarioRepo = require('../repositories/usuario.repository');
const { enviarCorreoVerificacion } = require('../utils/mailer.util');
const Logger = require('../utils/logger.util');

const TTL_MINUTOS = parseInt(process.env.VERIFICACION_CORREO_TTL_MINUTOS, 10) || 60 * 24; // 24h por defecto

const _hash = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Genera un token de verificación para el usuario indicado y le envía el correo.
 * Idempotente: si ya está verificado, no genera nada nuevo.
 * @param {Object} usuario - Debe traer al menos {id, correo, nombre, correo_verificado}.
 * @returns {Promise<void>}
 */
const solicitar = async (usuario) => {
  if (usuario.correo_verificado) return;

  await repo.invalidarPendientes(usuario.id);

  const token = crypto.randomBytes(32).toString('hex');
  const fecha_expiracion = new Date(Date.now() + TTL_MINUTOS * 60 * 1000);
  await repo.create({ usuario_id: usuario.id, token_hash: _hash(token), fecha_expiracion });

  const link = `${process.env.FRONTEND_URL || ''}/verificar-correo?token=${token}`;
  const { enviado } = await enviarCorreoVerificacion(usuario.correo, usuario.nombre, link);

  // Fuera de producción, si el correo no salió (sin SMTP configurado, o el proveedor
  // rechazó el envío) el enlace se registra en el log para poder probar el flujo completo
  // sin bandeja de entrada. En producción NUNCA: el token en claro en un log es una
  // credencial que permite verificar la cuenta de otro.
  if (!enviado && process.env.NODE_ENV !== 'production') {
    Logger.info(`[dev] Enlace de verificación para ${usuario.correo}: ${link}`);
  }
};

/**
 * Consume un token de verificación y marca el correo del usuario como verificado.
 * @param {string} token
 * @throws {Object} 400 si el token es inválido, ya se usó o expiró.
 * @returns {Promise<void>}
 */
const confirmar = async (token) => {
  if (!token) throw { status: 400, message: 'El token es requerido' };

  const solicitud = await repo.findByTokenHash(_hash(token));
  if (!solicitud) throw { status: 400, message: 'Token inválido' };
  if (solicitud.usado) throw { status: 400, message: 'El token ya fue utilizado' };
  if (new Date(solicitud.fecha_expiracion) < new Date()) {
    throw { status: 400, message: 'El token ha expirado' };
  }

  await usuarioRepo.update(solicitud.usuario_id, { correo_verificado: true });
  await repo.marcarUsado(solicitud.id);
};

module.exports = { solicitar, confirmar };
