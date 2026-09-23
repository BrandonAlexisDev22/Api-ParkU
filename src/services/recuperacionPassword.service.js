/**
 * @module RecuperacionPasswordService
 * @description Flujo de recuperación de contraseña (HU 02.2.3.2): verificar la identidad
 * de la persona con datos que ya tiene el sistema (correo, documento y nombre) y luego
 * consumir el token que esa verificación entrega para fijar una contraseña nueva. No
 * requiere sesión previa, igual que login/registro, y no depende de ningún canal externo
 * (correo, SMS): todo ocurre en la misma petición.
 *
 * El token que se entrega es aleatorio y en claro; en la base de datos solo se guarda su
 * hash SHA-256 (no reversible) -- si alguien lee la tabla `recuperacion_password` (un
 * backup, un dump, un acceso indebido) no puede reconstruir tokens utilizables.
 */

const crypto = require('crypto');
const repo = require('../repositories/recuperacionPassword.repository');
const usuarioRepo = require('../repositories/usuario.repository');
const PasswordUtil = require('../utils/password.util');

const TTL_MINUTOS = parseInt(process.env.RECUPERACION_PASSWORD_TTL_MINUTOS, 10) || 60;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIPOS_DOCUMENTO_VALIDOS = ['CC', 'CE', 'TI', 'PASAPORTE', 'PEP', 'NIT'];

const _hash = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Verifica que correo + tipo/número de documento + nombre correspondan a la misma cuenta
 * y, si coinciden, genera un token de recuperación. A diferencia del enlace por correo, el
 * token se devuelve directamente en la respuesta -- no hay canal externo por el que enviarlo
 * -- así que quien llama pasa de inmediato a fijar la contraseña nueva con `restablecer()`.
 *
 * Sí revela si los datos coinciden o no (a diferencia del flujo por correo, que respondía
 * igual siempre): es inherente al mecanismo, que reemplaza ese silencio por el freno del
 * limitador de intentos (ver rateLimit.middleware.js).
 * @param {string} correo
 * @param {string} tipoDocumento
 * @param {string} numeroDocumento
 * @param {string} nombre
 * @returns {Promise<string>} El token en claro.
 */
const verificarIdentidad = async (correo, tipoDocumento, numeroDocumento, nombre) => {
  if (!correo || !tipoDocumento || !numeroDocumento || !nombre) {
    throw { status: 400, message: 'correo, tipoDocumento, numeroDocumento y nombre son requeridos' };
  }
  if (!EMAIL_REGEX.test(correo)) throw { status: 400, message: 'El correo electrónico no tiene un formato válido' };
  const tipoNormalizado = tipoDocumento.toString().trim().toUpperCase();
  if (!TIPOS_DOCUMENTO_VALIDOS.includes(tipoNormalizado)) {
    throw { status: 400, message: 'Tipo de documento inválido' };
  }

  // Mismo criterio que el login: el correo tal cual o la forma heredada de normalizeEmail().
  const usuario = await usuarioRepo.findParaAcceso(correo);
  const numeroNormalizado = numeroDocumento.toString().trim();
  const nombreNormalizado = nombre.toString().trim().toLowerCase();

  const coincide = !!usuario
    && usuario.tipo_documento
    && usuario.tipo_documento.toUpperCase() === tipoNormalizado
    && usuario.numero_documento
    && usuario.numero_documento.toString().trim() === numeroNormalizado
    && usuario.nombre
    && usuario.nombre.trim().toLowerCase() === nombreNormalizado;

  if (!coincide) {
    throw { status: 400, message: 'Los datos no coinciden con ninguna cuenta registrada' };
  }

  // Evita que dos solicitudes sucesivas dejen dos tokens simultáneamente válidos.
  await repo.invalidarPendientes(usuario.id);

  const token = crypto.randomBytes(32).toString('hex');
  const fecha_expiracion = new Date(Date.now() + TTL_MINUTOS * 60 * 1000);
  await repo.create({ usuario_id: usuario.id, token_hash: _hash(token), fecha_expiracion });

  return token;
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
  if (typeof token !== 'string' || typeof nuevaContrasena !== 'string') {
    throw { status: 400, message: 'token y nuevaContrasena deben ser texto' };
  }
  // Misma política de fortaleza que el registro: restablecer no es la puerta de atrás para
  // dejar una contraseña débil.
  PasswordUtil.validarFortaleza(nuevaContrasena);

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
  // Si la cuenta se bloqueó por intentos fallidos, la contraseña nueva la desbloquea.
  await usuarioRepo.desbloquearTrasRecuperacion(solicitud.usuario_id);
  await repo.marcarUsado(solicitud.id);
};

module.exports = { verificarIdentidad, restablecer };
