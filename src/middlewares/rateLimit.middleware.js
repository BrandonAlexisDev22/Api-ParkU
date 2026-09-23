/**
 * ====================================================
 * LIMITADORES DE PETICIONES (express-rate-limit)
 * ====================================================
 *
 * Sin esto, cualquier cliente podía probar contraseñas, códigos de verificación o correos
 * sin ningún freno más que el bloqueo de cuenta tras 5 fallos (que además le sirve a un
 * atacante para dejar bloqueada a quien quiera). Aquí hay dos niveles:
 *
 * - `limitadorGlobal`: techo por IP para toda la API. Amplio a propósito: una pantalla
 *   normal hace decenas de peticiones por minuto (listas, notificaciones, monitoreo) y
 *   detrás del NAT del centro muchas personas comparten la misma IP. Su objetivo es frenar
 *   inundaciones, no el uso intenso legítimo.
 * - Limitadores estrictos para los endpoints sensibles de autenticación, que se aplican
 *   ADEMÁS del global. Se cuentan por IP y, cuando viene, por correo: así un atacante no
 *   agota el cupo de todos los usuarios de una misma red (p. ej. la del centro) y tampoco
 *   puede repartir los intentos contra una sola cuenta entre muchas IPs sin límite.
 *
 * Todos responden 429 con el mismo formato { success, message } que usa el resto de la API,
 * y mandan las cabeceras estándar RateLimit-* para que el frontend pueda mostrar cuánto
 * falta. Los límites se pueden ajustar por variables de entorno sin tocar código.
 *
 * `trust proxy` está en 1 (src/index.js), así que req.ip es la IP real detrás de nginx.
 *
 * @module RateLimitMiddleware
 */

const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const MINUTO_MS = 60 * 1000;

const entero = (valor, porDefecto) => {
  const n = parseInt(valor, 10);
  return Number.isFinite(n) && n > 0 ? n : porDefecto;
};

const respuesta429 = (mensaje) => (req, res) => {
  res.status(429).json({ success: false, status: 429, message: mensaje });
};

/** Clave por IP + correo (normalizado) cuando el body o la query lo traen. */
const clavePorIpYCorreo = (req) => {
  const ip = ipKeyGenerator(req.ip);
  const correo = req.body?.correo ?? req.query?.correo;
  if (typeof correo !== 'string' || !correo) return ip;
  return `${ip}|${correo.trim().toLowerCase()}`;
};

const crear = ({ ventanaMs, maximo, mensaje, porCorreo = false, soloFallos = false }) =>
  rateLimit({
    windowMs: ventanaMs,
    limit: maximo,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: porCorreo ? clavePorIpYCorreo : undefined,
    // Para el login solo cuentan los intentos fallidos: quien entra bien no gasta cupo.
    skipSuccessfulRequests: soloFallos,
    handler: respuesta429(mensaje),
  });

// ---------- Global ----------
const limitadorGlobal = crear({
  ventanaMs: entero(process.env.RATE_LIMIT_WINDOW_MS, 15 * MINUTO_MS),
  maximo: entero(process.env.RATE_LIMIT_MAX, 1500),
  mensaje: 'Demasiadas peticiones desde esta dirección. Intenta de nuevo en unos minutos.',
});

// ---------- Autenticación ----------
const limitadorLogin = crear({
  ventanaMs: 15 * MINUTO_MS,
  maximo: entero(process.env.RATE_LIMIT_LOGIN_MAX, 10),
  porCorreo: true,
  soloFallos: true,
  mensaje: 'Demasiados intentos de inicio de sesión. Espera 15 minutos e inténtalo de nuevo.',
});

const limitadorRegistro = crear({
  ventanaMs: 60 * MINUTO_MS,
  maximo: entero(process.env.RATE_LIMIT_REGISTRO_MAX, 10),
  mensaje: 'Demasiados registros desde esta dirección. Intenta de nuevo más tarde.',
});

// Recuperar contraseña, reenviar verificación: cada petición manda un correo. Sin freno,
// un atacante puede llenar la bandeja de una víctima o gastar la cuota del proveedor SMTP.
const limitadorEnvioCorreo = crear({
  ventanaMs: 60 * MINUTO_MS,
  maximo: entero(process.env.RATE_LIMIT_CORREO_MAX, 5),
  porCorreo: true,
  mensaje: 'Ya se enviaron varios correos a esa dirección. Revisa tu bandeja o espera una hora.',
});

// Verificar identidad para recuperar contraseña: aquí se intenta adivinar el documento y el
// nombre de una cuenta a partir del correo, sin el freno natural de tener que recibir algo
// por un canal aparte. Estricto y por correo+IP, igual que el envío de correo que reemplaza.
const limitadorVerificarIdentidad = crear({
  ventanaMs: 60 * MINUTO_MS,
  maximo: entero(process.env.RATE_LIMIT_VERIFICAR_IDENTIDAD_MAX, 5),
  porCorreo: true,
  mensaje: 'Demasiados intentos. Espera una hora e inténtalo de nuevo.',
});

// Restablecer contraseña, verificar código, verificar enlace: aquí se adivina un token o un
// código de 6 dígitos. El servicio ya invalida el código tras varios fallos; esto cubre el
// enlace y evita que se intente contra muchas cuentas a la vez.
const limitadorCanjeToken = crear({
  ventanaMs: 15 * MINUTO_MS,
  maximo: entero(process.env.RATE_LIMIT_TOKEN_MAX, 10),
  porCorreo: true,
  mensaje: 'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.',
});

// existe-correo / existe-numero / existe-documento son públicos por diseño (validación en
// vivo del formulario de registro), pero sin límite permiten enumerar cuentas a escala.
const limitadorConsultaExistencia = crear({
  ventanaMs: MINUTO_MS,
  maximo: entero(process.env.RATE_LIMIT_EXISTE_MAX, 30),
  mensaje: 'Demasiadas consultas. Espera un momento e inténtalo de nuevo.',
});

// Cambio de contraseña con sesión iniciada: exige la contraseña actual, así que sin límite
// era un oráculo para adivinarla sin pasar por el bloqueo del login.
const limitadorCambioContrasena = crear({
  ventanaMs: 15 * MINUTO_MS,
  maximo: entero(process.env.RATE_LIMIT_CAMBIO_PWD_MAX, 10),
  mensaje: 'Demasiados intentos de cambio de contraseña. Espera 15 minutos.',
});

module.exports = {
  limitadorGlobal,
  limitadorLogin,
  limitadorRegistro,
  limitadorEnvioCorreo,
  limitadorCanjeToken,
  limitadorConsultaExistencia,
  limitadorCambioContrasena,
  limitadorVerificarIdentidad,
};
