/**
 * @module VerificacionCorreoService
 * @description Verificación de correo tras el registro. Distingue "correo con formato
 * válido" (una regex no puede probar más que eso) de "correo verificado" (el dueño de la
 * cuenta efectivamente recibió y abrió un enlace, o escribió el código, enviado a esa
 * dirección).
 *
 * Cada solicitud emite DOS credenciales equivalentes: un token largo (64 hex) que viaja
 * en el enlace, y un código de 6 dígitos que el usuario escribe en la app. Usar cualquiera
 * marca la fila como usada y anula la otra.
 *
 * El código NO se guarda: se DERIVA del token_hash que ya está en la tabla, con
 * HMAC-SHA256 usando JWT_SECRET como clave. Así el esquema de 'verificacion_correo' no
 * cambia -- nadie tiene que correr migraciones ni tocar la base -- y la seguridad es la
 * misma que si se guardara aparte: quien lea un dump ve el token_hash pero no puede
 * derivar el código sin JWT_SECRET, que no vive en la base de datos.
 *
 * Seis dígitos son solo un millón de combinaciones, adivinables en línea. Por eso hay un
 * límite de intentos: al quinto fallo la solicitud se marca usada (eso sí es persistente,
 * usa la columna 'usado' que ya existía) y hay que pedir un código nuevo. El contador en
 * sí vive en memoria del proceso, que es suficiente porque el efecto de agotarlo sí queda
 * escrito en la base. Esto importa especialmente porque el proyecto ya no tiene rate
 * limiting HTTP.
 */

const crypto = require('crypto');
const repo = require('../repositories/verificacionCorreo.repository');
const usuarioRepo = require('../repositories/usuario.repository');
const { enviarCorreoVerificacion } = require('../utils/mailer.util');
const Logger = require('../utils/logger.util');

const TTL_MINUTOS = parseInt(process.env.VERIFICACION_CORREO_TTL_MINUTOS, 10) || 60 * 24; // enlace: 24h
const CODIGO_TTL_MINUTOS = parseInt(process.env.VERIFICACION_CODIGO_TTL_MINUTOS, 10) || 60; // código: 1h
const CODIGO_LONGITUD = 6;
const MAX_INTENTOS = 5;

// Mensaje único para todo fallo de código (inexistente, caducado, equivocado, cuenta que
// no existe). Distinguirlos le diría a un atacante si el correo está registrado y si su
// código va "por buen camino".
const ERROR_GENERICO = 'Código inválido o expirado';
const ERROR_INTENTOS = 'Demasiados intentos fallidos. Solicita un código nuevo.';

/** id de solicitud -> {fallos, expira}. Ver la nota de arriba sobre por qué en memoria. */
const intentosPorSolicitud = new Map();

const _hash = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Deriva el código de 6 dígitos a partir del token_hash de la solicitud. Determinista:
 * la misma fila siempre da el mismo código, que es lo que permite no guardarlo.
 *
 * La clave es JWT_SECRET, no una constante del código: sin ella, cualquiera que leyera la
 * tabla podría calcular el código de cualquier solicitud pendiente y verificar cuentas
 * ajenas.
 *
 * @private
 * @param {string} tokenHash
 * @returns {string} 6 dígitos, con ceros a la izquierda incluidos.
 */
const _codigoDesde = (tokenHash) => {
  const clave = process.env.JWT_SECRET;
  if (!clave) {
    throw { status: 500, message: 'JWT_SECRET no está configurado; no se puede derivar el código de verificación' };
  }
  const digest = crypto.createHmac('sha256', clave).update(`codigo-verificacion:${tokenHash}`).digest();
  // Los 4 primeros bytes como entero sin signo, reducidos al rango de 6 dígitos. El
  // módulo introduce un sesgo despreciable (2^32 no es múltiplo de 10^6: unos valores
  // salen 4295 veces y otros 4294, una diferencia de 0.02%).
  return (digest.readUInt32BE(0) % 10 ** CODIGO_LONGITUD).toString().padStart(CODIGO_LONGITUD, '0');
};

/**
 * Compara en tiempo constante. Un `===` normal corta en el primer carácter distinto, y esa
 * diferencia de microsegundos es medible: permitiría ir adivinando el código dígito a
 * dígito en vez de tener que probar el millón de combinaciones.
 * @private
 */
const _igualSeguro = (a, b) => {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Momento en que caduca el código de una solicitud: se calcula desde fecha_solicitud, que
 * ya está en la tabla. Es más corto que fecha_expiracion (la del enlace) porque un código
 * de 6 dígitos es mucho más fácil de adivinar que un token de 64 caracteres.
 * @private
 */
const _expiracionCodigo = (solicitud) => new Date(
  new Date(solicitud.fecha_solicitud).getTime() + CODIGO_TTL_MINUTOS * 60 * 1000,
);

/**
 * Descarta del contador en memoria las solicitudes cuyo código ya expiró, para que el Map
 * no crezca sin límite en un proceso de larga vida.
 * @private
 */
const _limpiarIntentosViejos = () => {
  const ahora = Date.now();
  for (const [id, dato] of intentosPorSolicitud) {
    if (dato.expira < ahora) intentosPorSolicitud.delete(id);
  }
};

/**
 * Genera enlace + código de verificación para el usuario indicado y le envía el correo.
 * Idempotente: si ya está verificado, no genera nada nuevo.
 * @param {Object} usuario - Debe traer al menos {id, correo, nombre, correo_verificado}.
 * @returns {Promise<void>}
 */
const solicitar = async (usuario) => {
  if (usuario.correo_verificado) return;

  await repo.invalidarPendientes(usuario.id);

  const token = crypto.randomBytes(32).toString('hex');
  const token_hash = _hash(token);
  const codigo = _codigoDesde(token_hash);
  const fecha_expiracion = new Date(Date.now() + TTL_MINUTOS * 60 * 1000);

  await repo.create({ usuario_id: usuario.id, token_hash, fecha_expiracion });

  const link = `${process.env.FRONTEND_URL || ''}/verificar-correo?token=${token}`;
  const { enviado } = await enviarCorreoVerificacion(usuario.correo, usuario.nombre, link, {
    codigo,
    minutos: CODIGO_TTL_MINUTOS,
  });

  // Fuera de producción, si el correo no salió (sin SMTP configurado, o el proveedor
  // rechazó el envío) el enlace y el código se registran en el log para poder probar el
  // flujo completo sin bandeja de entrada. En producción NUNCA: son credenciales que
  // permiten verificar la cuenta de otro.
  if (!enviado && process.env.NODE_ENV !== 'production') {
    Logger.info(`[dev] Verificación para ${usuario.correo} · código: ${codigo} · enlace: ${link}`);
  }
};

/**
 * Consume el token del enlace y marca el correo del usuario como verificado.
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
  intentosPorSolicitud.delete(solicitud.id);
};

/**
 * Consume el código de 6 dígitos y marca el correo como verificado.
 *
 * Todos los fallos responden lo mismo (ERROR_GENERICO) salvo el de intentos agotados, que
 * sí necesita decirle al usuario legítimo que pida un código nuevo -- y que solo alcanza
 * quien ya estaba fallando repetidamente contra esa cuenta.
 *
 * @param {string} correo
 * @param {string} codigo - 6 dígitos; se ignoran espacios y guiones al copiar/pegar.
 * @throws {Object} 400 en cualquier fallo de validación.
 * @returns {Promise<void>}
 */
const confirmarCodigo = async (correo, codigo) => {
  if (!correo || !codigo) {
    throw { status: 400, message: 'El correo y el código son requeridos' };
  }

  const limpio = String(codigo).replace(/[\s-]/g, '');
  if (!new RegExp(`^\\d{${CODIGO_LONGITUD}}$`).test(limpio)) {
    throw { status: 400, message: `El código debe tener ${CODIGO_LONGITUD} dígitos` };
  }

  const usuario = await usuarioRepo.findByCorreo(String(correo).trim().toLowerCase());
  if (!usuario) throw { status: 400, message: ERROR_GENERICO };
  if (usuario.correo_verificado) return; // Idempotente: reintentar no debe dar error.

  const solicitud = await repo.findPendientePorUsuario(usuario.id);
  if (!solicitud) throw { status: 400, message: ERROR_GENERICO };

  _limpiarIntentosViejos();
  const expiraEn = _expiracionCodigo(solicitud);
  const registro = intentosPorSolicitud.get(solicitud.id) || { fallos: 0, expira: expiraEn.getTime() };

  if (registro.fallos >= MAX_INTENTOS) {
    await repo.marcarUsado(solicitud.id);
    throw { status: 400, message: ERROR_INTENTOS };
  }

  if (expiraEn < new Date()) throw { status: 400, message: ERROR_GENERICO };

  if (!_igualSeguro(limpio, _codigoDesde(solicitud.token_hash))) {
    registro.fallos += 1;
    intentosPorSolicitud.set(solicitud.id, registro);
    if (registro.fallos >= MAX_INTENTOS) {
      // Quemar la solicitud en el intento que agota el margen, no en el siguiente: si no,
      // el atacante tendría un intento extra por cada código que pida.
      await repo.marcarUsado(solicitud.id);
      throw { status: 400, message: ERROR_INTENTOS };
    }
    throw { status: 400, message: ERROR_GENERICO };
  }

  await usuarioRepo.update(usuario.id, { correo_verificado: true });
  await repo.marcarUsado(solicitud.id);
  intentosPorSolicitud.delete(solicitud.id);
};

module.exports = { solicitar, confirmar, confirmarCodigo };
