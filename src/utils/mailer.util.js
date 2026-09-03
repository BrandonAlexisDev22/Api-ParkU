/**
 * @module MailerUtil
 * @description Envío de correo transaccional (verificación de cuenta, recuperación de
 * contraseña) vía SMTP. Todas las credenciales vienen de variables de entorno -- nunca
 * hardcodeadas. Si SMTP_HOST no está configurado (p. ej. en desarrollo local sin
 * credenciales reales), las funciones de envío quedan en no-op con un warning en el log
 * en vez de lanzar: el flujo de negocio (generar/guardar el token) nunca depende de que
 * el correo realmente salga.
 */

const nodemailer = require('nodemailer');
const Logger = require('./logger.util');

let transporter = null;
let transporterInicializado = false;

/**
 * Crea (una sola vez, perezosamente) el transporte SMTP a partir de las variables de
 * entorno. Devuelve null si SMTP_HOST no está configurado.
 * @private
 * @returns {import('nodemailer').Transporter|null}
 */
const _getTransporter = () => {
  if (transporterInicializado) return transporter;
  transporterInicializado = true;

  if (!process.env.SMTP_HOST) {
    Logger.warn('SMTP no configurado (falta SMTP_HOST) -- los correos transaccionales no se enviarán, solo se registrarán en el log.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  return transporter;
};

/**
 * Envía un correo. Nunca lanza -- un fallo de correo no debe tumbar el flujo de negocio
 * que lo dispara (registro, recuperación de contraseña); se loguea y ya.
 * @param {Object} datos
 * @param {string} datos.destino
 * @param {string} datos.asunto
 * @param {string} datos.html
 * @returns {Promise<{enviado: boolean}>}
 */
const enviarCorreo = async ({ destino, asunto, html }) => {
  const t = _getTransporter();
  if (!t) {
    Logger.info(`[correo omitido, SMTP no configurado] Para: ${destino} · Asunto: ${asunto}`);
    return { enviado: false };
  }

  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: destino,
      subject: asunto,
      html,
    });
    return { enviado: true };
  } catch (error) {
    Logger.error('Error enviando correo', { destino, asunto, error: error.message });
    return { enviado: false };
  }
};

const _plantillaBase = (titulo, cuerpoHtml) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
    <h2>${titulo}</h2>
    ${cuerpoHtml}
    <p style="color:#888; font-size:12px; margin-top:24px;">ParkU · Sistema de gestión de parqueaderos SENA</p>
  </div>
`;

/**
 * @param {string} destino
 * @param {string} nombre
 * @param {string} link
 */
const enviarCorreoVerificacion = (destino, nombre, link) => enviarCorreo({
  destino,
  asunto: 'Verifica tu correo — ParkU',
  html: _plantillaBase('Verifica tu correo', `
    <p>Hola ${nombre || ''},</p>
    <p>Confirma tu correo electrónico para activar todas las funciones de tu cuenta ParkU:</p>
    <p><a href="${link}" target="_blank">Verificar mi correo</a></p>
    <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
  `),
});

/**
 * @param {string} destino
 * @param {string} nombre
 * @param {string} link
 */
const enviarCorreoRecuperacion = (destino, nombre, link) => enviarCorreo({
  destino,
  asunto: 'Recupera tu contraseña — ParkU',
  html: _plantillaBase('Recupera tu contraseña', `
    <p>Hola ${nombre || ''},</p>
    <p>Recibimos una solicitud para restablecer tu contraseña. Este enlace expira pronto y solo puede usarse una vez:</p>
    <p><a href="${link}" target="_blank">Restablecer mi contraseña</a></p>
    <p>Si no solicitaste esto, puedes ignorar este mensaje; tu contraseña no ha cambiado.</p>
  `),
});

module.exports = { enviarCorreo, enviarCorreoVerificacion, enviarCorreoRecuperacion };
