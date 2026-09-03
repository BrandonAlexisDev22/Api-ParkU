/**
 * @module MailerUtil
 * @description Envío de correo transaccional (verificación de cuenta, recuperación de
 * contraseña) vía SMTP. Todas las credenciales vienen de variables de entorno -- nunca
 * hardcodeadas.
 *
 * Soporta cualquiera de los servicios de correo que nodemailer ya conoce (Gmail,
 * Outlook365/Hotmail, Yahoo, Zoho, iCloud, Brevo, SendGrid, Mailgun, Postmark, Resend,
 * Mailtrap, SES por región, Yandex, GMX, QQ...): basta poner su nombre en MAIL_SERVICE y
 * el host/puerto/TLS salen del catálogo de nodemailer, sin tener que recordarlos. Para un
 * proveedor fuera de ese catálogo (SMTP corporativo, cPanel, un relay propio) se configura
 * a mano con SMTP_HOST/SMTP_PORT/SMTP_SECURE. MAIL_SERVICE tiene prioridad sobre SMTP_HOST.
 *
 * Si no hay ni MAIL_SERVICE ni SMTP_HOST (p. ej. en desarrollo local sin credenciales
 * reales), las funciones de envío quedan en no-op con un warning en el log en vez de
 * lanzar: el flujo de negocio (generar/guardar el token) nunca depende de que el correo
 * realmente salga.
 */

const nodemailer = require('nodemailer');
const buscarServicio = require('nodemailer/lib/well-known');
const catalogoServicios = require('nodemailer/lib/well-known/services.json');
const Logger = require('./logger.util');

let transporter = null;
let transporterInicializado = false;
let configuracionEfectiva = null;

/**
 * Nombres de servicio aceptados por MAIL_SERVICE, incluyendo alias (Brevo por
 * SendinBlue, Google Mail por Gmail, etc.). Se usa para sugerir valores válidos cuando
 * alguien escribe mal el nombre.
 * @returns {string[]}
 */
const listarServicios = () => {
  const nombres = new Set();
  for (const [clave, datos] of Object.entries(catalogoServicios)) {
    nombres.add(clave);
    for (const alias of datos.aliases || []) nombres.add(alias);
  }
  return [...nombres].sort((a, b) => a.localeCompare(b));
};

const _esVerdadero = (valor) => /^(true|1|si|sí|yes)$/i.test((valor || '').trim());

/**
 * Traduce las variables de entorno a las opciones concretas de nodemailer. Resuelve el
 * preset del servicio a host/puerto/TLS explícitos (en vez de pasar `service` tal cual)
 * para poder registrar en el log exactamente contra qué servidor se está enviando.
 * @private
 * @returns {Object|null} Opciones de transporte, o null si no hay proveedor configurado.
 */
const _resolverConfig = () => {
  const servicio = (process.env.MAIL_SERVICE || process.env.SMTP_SERVICE || '').trim();
  let config;

  if (servicio) {
    const preset = buscarServicio(servicio);
    if (!preset) {
      Logger.error(`MAIL_SERVICE="${servicio}" no es un servicio de correo conocido -- no se enviarán correos.`, {
        servicios_validos: listarServicios().join(', '),
      });
      return null;
    }
    config = {
      servicio: preset.description || servicio,
      host: preset.host,
      port: preset.port,
      secure: preset.secure === true,
      ...(preset.authMethod && { authMethod: preset.authMethod }),
    };
  } else if (process.env.SMTP_HOST) {
    config = {
      servicio: null,
      host: process.env.SMTP_HOST.trim(),
      port: 587,
      secure: false,
    };
  } else {
    return null;
  }

  // SMTP_PORT/SMTP_SECURE, si vienen, mandan sobre el preset: el mismo proveedor suele
  // aceptar 465 (TLS directo) y 587 (STARTTLS), y hay redes que bloquean uno de los dos.
  if (process.env.SMTP_PORT) {
    const puerto = parseInt(process.env.SMTP_PORT, 10);
    if (puerto) {
      config.port = puerto;
      config.secure = puerto === 465;
    }
  }
  if (process.env.SMTP_SECURE) {
    config.secure = _esVerdadero(process.env.SMTP_SECURE);
  }

  if (process.env.SMTP_USER) {
    config.auth = { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD };
  }

  return config;
};

/**
 * Crea (una sola vez, perezosamente) el transporte SMTP. Devuelve null si no hay
 * proveedor configurado o si MAIL_SERVICE trae un nombre desconocido.
 * @private
 * @returns {import('nodemailer').Transporter|null}
 */
const _getTransporter = () => {
  if (transporterInicializado) return transporter;
  transporterInicializado = true;

  const config = _resolverConfig();
  if (!config) {
    // Si venía un MAIL_SERVICE inválido, _resolverConfig ya explicó el porqué; no repetir
    // el genérico "falta configurar", que apuntaría al problema equivocado.
    if (!process.env.MAIL_SERVICE && !process.env.SMTP_SERVICE && !process.env.SMTP_HOST) {
      Logger.warn('SMTP no configurado (falta MAIL_SERVICE o SMTP_HOST) -- los correos transaccionales no se enviarán, solo se registrarán en el log.');
    }
    return null;
  }

  configuracionEfectiva = config;
  const { servicio, ...opciones } = config;
  transporter = nodemailer.createTransport(opciones);

  Logger.info(`SMTP configurado: ${servicio || 'servidor personalizado'} (${config.host}:${config.port}, ${config.secure ? 'TLS directo' : 'STARTTLS'})`, {
    usuario: config.auth ? config.auth.user : '(sin autenticación)',
  });
  return transporter;
};

/**
 * Abre una conexión al servidor SMTP y valida las credenciales sin enviar nada. Útil al
 * arrancar el servidor y desde `npm run mail:test`.
 * @returns {Promise<{configurado: boolean, ok: boolean, detalle: string}>}
 */
const verificarConexion = async () => {
  const t = _getTransporter();
  if (!t) {
    return { configurado: false, ok: false, detalle: 'Sin proveedor SMTP configurado (MAIL_SERVICE / SMTP_HOST vacíos)' };
  }

  try {
    await t.verify();
    const detalle = `Conexión SMTP verificada con ${configuracionEfectiva.servicio || configuracionEfectiva.host} (${configuracionEfectiva.host}:${configuracionEfectiva.port})`;
    Logger.info(detalle);
    return { configurado: true, ok: true, detalle };
  } catch (error) {
    Logger.error('No se pudo verificar la conexión SMTP', {
      host: configuracionEfectiva.host,
      port: configuracionEfectiva.port,
      error: error.message,
    });
    return { configurado: true, ok: false, detalle: error.message };
  }
};

/**
 * Envía un correo. Nunca lanza -- un fallo de correo no debe tumbar el flujo de negocio
 * que lo dispara (registro, recuperación de contraseña); se loguea y ya.
 * @param {Object} datos
 * @param {string} datos.destino
 * @param {string} datos.asunto
 * @param {string} datos.html
 * @param {string} [datos.texto] - Alternativa en texto plano: mejora la entregabilidad y
 *   sirve a los clientes que no muestran HTML.
 * @returns {Promise<{enviado: boolean, motivo?: string}>}
 */
const enviarCorreo = async ({ destino, asunto, html, texto }) => {
  const t = _getTransporter();
  if (!t) {
    Logger.info(`[correo omitido, SMTP no configurado] Para: ${destino} · Asunto: ${asunto}`);
    return { enviado: false, motivo: 'SMTP no configurado' };
  }

  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: destino,
      subject: asunto,
      html,
      ...(texto && { text: texto }),
    });
    return { enviado: true };
  } catch (error) {
    Logger.error('Error enviando correo', { destino, asunto, error: error.message });
    return { enviado: false, motivo: error.message };
  }
};

const _plantillaBase = (titulo, cuerpoHtml) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
    <h2>${titulo}</h2>
    ${cuerpoHtml}
    <p style="color:#888; font-size:12px; margin-top:24px;">ParkU · Sistema de gestión de parqueaderos SENA</p>
  </div>
`;

const _firmaTexto = '\n\nParkU · Sistema de gestión de parqueaderos SENA';

/**
 * Bloque destacado con el código de 6 dígitos. Va con estilos en línea y sin imágenes
 * porque los clientes de correo ignoran las hojas de estilo externas, y separado por
 * espacios para que se lea de un vistazo al teclearlo desde el móvil.
 * @private
 */
const _bloqueCodigo = (codigo, minutos) => `
  <p style="margin-bottom:8px;">Escribe este código en la aplicación:</p>
  <p style="font-family:'Courier New',monospace; font-size:32px; font-weight:bold;
            letter-spacing:8px; background:#f4f4f4; border-radius:6px;
            padding:16px; text-align:center; margin:0;">${codigo.split('').join(' ')}</p>
  <p style="color:#888; font-size:13px;">El código expira en ${minutos} minutos.</p>
`;

/**
 * @param {string} destino
 * @param {string} nombre
 * @param {string} link
 * @param {Object} [opciones]
 * @param {string} [opciones.codigo] - Código de 6 dígitos. Si falta, el correo va solo
 *   con el enlace (los llamados antiguos siguen funcionando igual).
 * @param {number} [opciones.minutos] - Minutos que dura el código, para avisarlo en el texto.
 */
const enviarCorreoVerificacion = (destino, nombre, link, opciones = {}) => {
  const { codigo, minutos = 60 } = opciones;

  const htmlCodigo = codigo ? _bloqueCodigo(codigo, minutos) : '';
  const htmlEnlace = codigo
    ? `<p style="color:#666; font-size:14px;">O si prefieres, verifica con un clic:
         <a href="${link}" target="_blank">Verificar mi correo</a></p>`
    : `<p><a href="${link}" target="_blank">Verificar mi correo</a></p>`;

  const textoCodigo = codigo
    ? `Tu código de verificación es: ${codigo}\nExpira en ${minutos} minutos.\n\nO verifica con este enlace:\n${link}`
    : `Confirma tu correo electrónico para activar tu cuenta ParkU:\n${link}`;

  return enviarCorreo({
    destino,
    asunto: codigo ? `${codigo} es tu código de verificación — ParkU` : 'Verifica tu correo — ParkU',
    html: _plantillaBase('Verifica tu correo', `
      <p>Hola ${nombre || ''},</p>
      <p>Confirma tu correo electrónico para activar todas las funciones de tu cuenta ParkU.</p>
      ${htmlCodigo}
      ${htmlEnlace}
      <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
    `),
    texto: `Hola ${nombre || ''},\n\n${textoCodigo}\n\nSi no creaste esta cuenta, puedes ignorar este mensaje.${_firmaTexto}`,
  });
};

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
  texto: `Hola ${nombre || ''},\n\nRecibimos una solicitud para restablecer tu contraseña. Este enlace expira pronto y solo puede usarse una vez:\n${link}\n\nSi no solicitaste esto, puedes ignorar este mensaje; tu contraseña no ha cambiado.${_firmaTexto}`,
});

module.exports = {
  enviarCorreo,
  enviarCorreoVerificacion,
  enviarCorreoRecuperacion,
  verificarConexion,
  listarServicios,
};
