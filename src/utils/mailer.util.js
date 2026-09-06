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
      /* El nombre visible del remitente. La DIRECCIÓN la impone la cuenta SMTP (Gmail
         reescribe cualquier otra), así que lo que se puede fijar es el nombre: quien recibe
         ve "ParkU (no responder)" y entiende que no debe contestar a ese correo. */
      from: process.env.MAIL_FROM || (process.env.SMTP_USER ? `"ParkU (no responder)" <${process.env.SMTP_USER}>` : undefined),
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

/* Los colores de la aplicación (src/styles/theme.ts del frontend). Van repetidos aquí a
   propósito: un correo no puede importar nada del frontend, y los clientes de correo ignoran
   las hojas de estilo — todo tiene que ir en línea y en hexadecimal. */
const MARCA = {
  verde: '#39A900',
  verdeOscuro: '#2D7D00',
  verdePalido: '#EAF7E6',
  texto: '#0F172A',
  textoSuave: '#64748B',
  borde: '#E2E8F0',
  fondo: '#F5F7F8',
};

/**
 * La estructura común de todos los correos de ParkU: cabecera verde con el logo, el contenido
 * sobre blanco y un pie discreto.
 *
 * El "logo" es la P de ParkU dibujada con un círculo y una letra, no una imagen: casi todos
 * los clientes de correo bloquean las imágenes externas por defecto, y una cabecera que
 * aparece vacía la primera vez es peor que ninguna.
 * @private
 */
const _plantillaBase = (titulo, cuerpoHtml) => `
  <div style="margin:0; padding:24px 12px; background:${MARCA.fondo}; font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid ${MARCA.borde};">
      <tr>
        <td style="background:linear-gradient(135deg,${MARCA.verde},${MARCA.verdeOscuro}); background-color:${MARCA.verde}; padding:22px 26px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width:38px; height:38px; background:#ffffff; border-radius:11px; text-align:center; vertical-align:middle; font-size:20px; font-weight:bold; color:${MARCA.verde}; font-family:Arial,Helvetica,sans-serif;">P</td>
              <td style="padding-left:12px; color:#ffffff; font-size:19px; font-weight:bold; letter-spacing:.3px;">ParkU</td>
            </tr>
          </table>
          <div style="margin-top:14px; color:#ffffff; font-size:17px; font-weight:bold;">${titulo}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 26px; color:${MARCA.texto}; font-size:14px; line-height:1.6;">
          ${cuerpoHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 26px; background:${MARCA.verdePalido}; color:${MARCA.textoSuave}; font-size:11.5px; line-height:1.5;">
          ParkU · Sistema de gestión de parqueaderos SENA<br>
          Este mensaje es automático: no respondas a este correo.
        </td>
      </tr>
    </table>
  </div>
`;

/**
 * El botón principal de un correo. Va como tabla y no como <button> porque los clientes de
 * correo no ejecutan estilos complejos, y con relleno propio para que sea pulsable en móvil.
 * @private
 */
const _boton = (texto, url) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0;">
    <tr>
      <td style="background:${MARCA.verde}; border-radius:10px;">
        <a href="${url}" target="_blank"
           style="display:inline-block; padding:12px 26px; color:#ffffff; font-size:14px; font-weight:bold; text-decoration:none;">
          ${texto}
        </a>
      </td>
    </tr>
  </table>
  <p style="color:${MARCA.textoSuave}; font-size:11.5px; word-break:break-all;">
    Si el botón no funciona, copia este enlace en tu navegador:<br>${url}
  </p>
`;

/**
 * Una ficha de datos (fecha, celda, parqueadero…). En dos columnas para que se lea de un
 * vistazo sin depender de que el cliente respete el ancho.
 * @private
 */
const _ficha = (filas) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
         style="margin:16px 0; border:1px solid ${MARCA.borde}; border-radius:10px; border-collapse:separate; overflow:hidden;">
    ${filas.map(([etiqueta, valor], i) => `
      <tr style="background:${i % 2 ? '#ffffff' : '#F8FAFC'};">
        <td style="padding:9px 14px; color:${MARCA.textoSuave}; font-size:12px; width:42%;">${etiqueta}</td>
        <td style="padding:9px 14px; color:${MARCA.texto}; font-size:13px; font-weight:bold;">${valor}</td>
      </tr>
    `).join('')}
  </table>
`;

const _firmaTexto = '\n\nParkU · Sistema de gestión de parqueaderos SENA\nEste mensaje es automático: no respondas a este correo.';

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

  return correos.enviarCorreo({
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
const enviarCorreoRecuperacion = (destino, nombre, link) => correos.enviarCorreo({
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

/**
 * Avisa de en qué quedó una reserva.
 *
 * Con los datos concretos —cuándo, dónde y en qué celda— y no solo "tu reserva cambió": quien
 * la pidió necesita saber a qué hora presentarse y a dónde ir, o por qué no la tiene.
 *
 * @param {string} destino
 * @param {string} nombre
 * @param {'ACEPTADA'|'RECHAZADA'|'CANCELADA'} desenlace
 * @param {Object} datos - { fecha, hora, parqueadero, celda, placa, motivo }
 */
const enviarCorreoReserva = (destino, nombre, desenlace, datos = {}) => {
  const aceptada = desenlace === 'ACEPTADA';
  const titulo = aceptada
    ? 'Tu reserva fue aceptada'
    : `Tu reserva fue ${desenlace === 'CANCELADA' ? 'cancelada' : 'rechazada'}`;

  const filas = [
    ['Fecha', datos.fecha || '—'],
    ['Horario', datos.hora || '—'],
    ['Parqueadero', datos.parqueadero || '—'],
    ['Celda', datos.celda || '—'],
  ];
  if (datos.placa) filas.push(['Vehículo', datos.placa]);

  const explicacion = aceptada
    ? '<p>Tu celda queda apartada para ese horario. Preséntate dentro de los primeros 20 minutos: pasado ese tiempo la reserva se cancela y la celda vuelve a quedar libre.</p>'
    : `<p>Esta reserva ya no está vigente y la celda quedó libre para otras personas.</p>${
      datos.motivo ? `<p style="background:#FEF3C7; border-radius:8px; padding:11px 13px; margin:14px 0;"><strong>Motivo:</strong> ${datos.motivo}</p>` : ''
    }<p>Puedes solicitar otra desde la aplicación cuando lo necesites.</p>`;

  const textoFilas = filas.map(([k, v]) => `${k}: ${v}`).join('\n');

  return correos.enviarCorreo({
    destino,
    asunto: `${titulo} — ParkU`,
    html: _plantillaBase(titulo, `
      <p>Hola ${nombre || ''},</p>
      ${_ficha(filas)}
      ${explicacion}
    `),
    texto: `Hola ${nombre || ''},\n\n${titulo}.\n\n${textoFilas}${datos.motivo ? `\nMotivo: ${datos.motivo}` : ''}${_firmaTexto}`,
  });
};

/**
 * Avisa a quien reportó un incidente de que su reporte se descartó, con el motivo.
 *
 * El motivo es el punto del mensaje: sin él, quien se tomó el trabajo de reportar algo solo ve
 * que su reporte desapareció.
 */
const enviarCorreoReporteDescartado = (destino, nombre, { descripcion, desenlace, motivo }) => {
  const palabra = desenlace === 'CANCELADA' ? 'cancelado' : 'rechazado';
  const titulo = `Tu reporte fue ${palabra}`;
  return correos.enviarCorreo({
    destino,
    asunto: `${titulo} — ParkU`,
    html: _plantillaBase(titulo, `
      <p>Hola ${nombre || ''},</p>
      <p>El reporte que registraste fue ${palabra} por el personal del parqueadero.</p>
      ${_ficha([['Reporte', descripcion || '—']])}
      <p style="background:#FEF3C7; border-radius:8px; padding:11px 13px;"><strong>Motivo:</strong> ${motivo || '—'}</p>
      <p>Si crees que se trata de un error, puedes registrarlo de nuevo con más detalle.</p>
    `),
    texto: `Hola ${nombre || ''},\n\nTu reporte fue ${palabra}.\n\nReporte: ${descripcion || '—'}\nMotivo: ${motivo || '—'}${_firmaTexto}`,
  });
};

/**
 * Avisa de que una cuenta quedó activa o inactiva.
 *
 * Una cuenta desactivada deja de poder reservar o entrar al parqueadero: enterarse al llegar a
 * la portería es la peor forma de saberlo.
 */
const enviarCorreoEstadoCuenta = (destino, nombre, activa, { motivo } = {}) => {
  const titulo = activa ? 'Tu cuenta fue reactivada' : 'Tu cuenta fue desactivada';
  const cuerpo = activa
    ? '<p>Ya puedes volver a iniciar sesión, reservar celdas y usar el parqueadero con normalidad.</p>'
    : `<p>Mientras esté desactivada no podrás reservar celdas ni registrar el ingreso de tus vehículos.</p>${
      motivo ? `<p style="background:#FEF3C7; border-radius:8px; padding:11px 13px; margin:14px 0;"><strong>Motivo:</strong> ${motivo}</p>` : ''
    }<p>Si crees que se trata de un error, comunícate con la administración del parqueadero.</p>`;

  return correos.enviarCorreo({
    destino,
    asunto: `${titulo} — ParkU`,
    html: _plantillaBase(titulo, `<p>Hola ${nombre || ''},</p>${cuerpo}`),
    texto: `Hola ${nombre || ''},\n\n${titulo}.${motivo ? `\nMotivo: ${motivo}` : ''}${_firmaTexto}`,
  });
};

/**
 * Envía sin dejar que un fallo del correo tumbe la operación que lo dispara.
 *
 * Aceptar una reserva o desactivar una cuenta son cambios que ya quedaron guardados: si el
 * servidor de correo está caído o las credenciales caducaron, lo que NO puede pasar es que la
 * petición falle y la persona crea que su acción no se hizo. Queda anotado en el log.
 *
 * @param {Promise} envio - La llamada a uno de los `enviarCorreo*` de este módulo.
 * @param {string} contexto - Qué se estaba avisando, para poder buscarlo en el log.
 */
const enviarSinBloquear = (envio, contexto) => Promise.resolve(envio)
  .catch((error) => {
    console.error(`No se pudo enviar el correo (${contexto}):`, error?.message || error);
  });

/* Las funciones de abajo llaman al envío a través de este objeto y no por su nombre: así
   se puede sustituir `enviarCorreo` desde fuera —una prueba comprueba QUÉ se habría
   enviado sin necesitar un servidor de correo— sin cambiar en nada el comportamiento real. */
const correos = {
  enviarCorreo,
  enviarSinBloquear,
  enviarCorreoVerificacion,
  enviarCorreoRecuperacion,
  enviarCorreoReserva,
  enviarCorreoReporteDescartado,
  enviarCorreoEstadoCuenta,
  verificarConexion,
  listarServicios,
};

module.exports = correos;
