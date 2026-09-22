/**
 * ====================================================
 * MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN
 * VERSIÓN SEQUELIZE
 * ====================================================
 *
 * @module AuthMiddleware
 */

const jwt = require('jsonwebtoken');
const { Usuario, sequelize } = require('../models');
const { ROLES } = require('../config/roles');

// =============================================
// Secreto y parámetros del JWT
// =============================================
// Se resuelven UNA vez al cargar el módulo y se valida que existan: sin esto, un despliegue
// sin JWT_SECRET arrancaba igual y firmaba tokens con `undefined` (jsonwebtoken lanza en
// cada login, pero ya en producción). Un secreto corto en producción también se rechaza:
// con HS256 el secreto es lo único que impide forjar un token con cualquier rol.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido. Configúralo en .env antes de arrancar la API.');
}
if (process.env.NODE_ENV === 'production' && JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET es demasiado corto para producción: usa al menos 32 caracteres aleatorios.');
}

// Algoritmo fijado explícitamente en firma y verificación. jsonwebtoken ya no acepta "none"
// con un secreto, pero dejarlo implícito es depender de ese default; y sin la lista, un
// cambio futuro a claves RSA abriría la confusión de algoritmos (verificar un HS256 firmado
// con la clave pública).
const JWT_ALGORITMOS = ['HS256'];
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

// Los tokens de acceso y de refresco llevan un claim `tipo` y cada uno solo vale para lo
// suyo. Antes tenían el mismo payload y la misma firma, así que un refresh token (30 días)
// servía como token de acceso: si se filtraba, daba sesión durante un mes en vez de que
// solo sirviera para pedir tokens nuevos (que a su vez se pueden cortar cambiando la
// contraseña o desactivando la cuenta).
const TIPO_ACCESS = 'access';
const TIPO_REFRESH = 'refresh';

/**
 * Extrae el token del header Authorization. Solo se acepta el esquema `Bearer`.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
const extraerBearer = (req) => {
  const cabecera = req.headers.authorization;
  if (typeof cabecera !== 'string') return null;
  const [esquema, token, ...resto] = cabecera.trim().split(/\s+/);
  if (!token || resto.length || esquema.toLowerCase() !== 'bearer') return null;
  return token;
};

/**
 * Verifica firma, expiración, algoritmo y tipo de un JWT emitido por esta API.
 * @param {string} token
 * @param {'access'|'refresh'} tipoEsperado
 * @returns {Object} payload
 * @throws {jwt.JsonWebTokenError|jwt.TokenExpiredError}
 */
const verificarJwt = (token, tipoEsperado) => {
  const decoded = jwt.verify(token, JWT_SECRET, { algorithms: JWT_ALGORITMOS });
  if (decoded.tipo !== tipoEsperado) {
    throw new jwt.JsonWebTokenError('tipo de token no válido para esta operación');
  }
  return decoded;
};

/**
 * ====================================================
 * verificarToken - Middleware de autenticación
 * ====================================================
 */
const verificarToken = async (req, res, next) => {
  try {
    const token = extraerBearer(req);

    if (!token) {
      return res.status(401).json({
        status: 401,
        message: 'Token no proporcionado'
      });
    }

    let decoded;
    try {
      decoded = verificarJwt(token, TIPO_ACCESS);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 401,
          message: 'Token expirado. Por favor, inicia sesión nuevamente'
        });
      }
      return res.status(401).json({
        status: 401,
        message: 'Token inválido'
      });
    }

    const user = await Usuario.findOne({
      where: { id: decoded.id, estado: 'ACTIVO' },
      attributes: ['id', 'correo', 'nombre', 'numero_telefonico', 'rol_id', 'estado', 'foto_perfil_url', 'fecha_cambio_contrasena'],
    });

    if (!user) {
      return res.status(401).json({
        status: 401,
        message: 'Usuario no encontrado o inactivo'
      });
    }

    // Invalida tokens emitidos ANTES del último cambio de contraseña (login normal,
    // restablecer-password, o el endpoint de cambiar contraseña -- los tres pasan por
    // usuarioRepo.updateContrasena, que fija fecha_cambio_contrasena). Retrocompatible: si
    // el usuario nunca cambió su contraseña (columna NULL) no se rechaza nada.
    if (user.fecha_cambio_contrasena) {
      const pwdTsToken = decoded.pwdTs || 0;
      const pwdTsUsuario = new Date(user.fecha_cambio_contrasena).getTime();
      if (pwdTsToken < pwdTsUsuario) {
        return res.status(401).json({
          status: 401,
          message: 'La contraseña fue cambiada recientemente. Inicia sesión nuevamente.'
        });
      }
    }

    req.usuario = {
      id: user.id,
      correo: user.correo,
      nombre: user.nombre,
      numero: user.numero_telefonico,
      rol: user.rol_id,
      foto_perfil_url: user.foto_perfil_url,
    };

    next();
  } catch (error) {
    console.error('Error en verificarToken:', error);
    return res.status(500).json({
      status: 500,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * ====================================================
 * verificarRol - Middleware de autorización por rol
 * ====================================================
 */
const verificarRol = (rolesRequeridos) => {
  const rolesArray = Array.isArray(rolesRequeridos) ? rolesRequeridos : [rolesRequeridos];

  return async (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          status: 401,
          message: 'Usuario no autenticado'
        });
      }

      if (!rolesArray.includes(req.usuario.rol)) {
        return res.status(403).json({
          status: 403,
          // Genérico a propósito: enumerar el permiso o el rol que falta le dice a quien
          // no debería tenerlo cómo está montado el control de acceso.
          message: 'No tienes los permisos requeridos'
        });
      }

      next();
    } catch (error) {
      console.error('Error en verificarRol:', error);
      return res.status(500).json({
        status: 500,
        message: 'Error en la verificación de rol'
      });
    }
  };
};

/**
 * ====================================================
 * Autorización por PERMISO (tabla rol_permiso)
 * ====================================================
 * Hasta ahora la tabla `rol_permiso` era decorativa: se podía editar, pero ninguna ruta la
 * consultaba, así que el acceso real dependía solo del id de rol escrito a mano en cada
 * ruta (verificarRol([1,2])). Consecuencia práctica: un rol nuevo creado desde
 * POST /api/roles no podía acceder a nada por muchos permisos que se le dieran.
 *
 * Estos dos middlewares hacen que los permisos gobiernen de verdad.
 */

// Caché de permisos por rol. rol_permiso es una tabla pequeña que cambia poco, y sin caché
// cada petición protegida añadiría una consulta extra a Neon (que está por red). Se invalida
// explícitamente al editar permisos -- ver invalidarCachePermisos -- para que un cambio se
// note al instante y no haya que esperar a que caduque.
const TTL_CACHE_PERMISOS_MS = 60 * 1000;
const cachePermisos = new Map(); // rol_id -> { permisos: Set<string>, expira: number }

/**
 * Permisos activos de un rol, con caché.
 * @param {number} rolId
 * @returns {Promise<Set<string>>}
 */
const permisosDelRol = async (rolId) => {
  const enCache = cachePermisos.get(rolId);
  if (enCache && enCache.expira > Date.now()) return enCache.permisos;

  const [filas] = await sequelize.query(
    `SELECT p.nombre
       FROM rol_permiso rp
       INNER JOIN permiso p ON p.id = rp.permiso_id
      WHERE rp.rol_id = :rol AND rp.estado = TRUE`,
    { replacements: { rol: rolId } },
  );

  const permisos = new Set(filas.map((f) => f.nombre));
  // Quien puede GESTIONAR un módulo puede también CONSULTARLO: sin esto, un rol creado a
  // medida con solo "Registrar salidas" (salida.gestionar) no podía ni cargar el listado
  // sobre el que registra esas salidas.
  for (const nombre of [...permisos]) {
    if (nombre.endsWith('.gestionar')) permisos.add(nombre.replace(/\.gestionar$/, '.consultar'));
  }
  cachePermisos.set(rolId, { permisos, expira: Date.now() + TTL_CACHE_PERMISOS_MS });
  return permisos;
};

/**
 * Olvida los permisos cacheados de un rol (o de todos). La llama rol.service cada vez que
 * se asignan, quitan o reemplazan permisos, para que el cambio surta efecto de inmediato.
 * @param {number} [rolId] - Sin argumento, limpia toda la caché.
 */
const invalidarCachePermisos = (rolId) => {
  if (rolId === undefined) cachePermisos.clear();
  else cachePermisos.delete(Number(rolId));
};

/**
 * Autoriza si el rol del usuario tiene ALGUNO de los permisos indicados.
 * El rol Administrador pasa siempre: es el rol protegido del sistema y por definición
 * conserva todos los permisos (ver rol.service.js).
 * @param {...string} permisosRequeridos
 */
const verificarPermiso = (...permisosRequeridos) => {
  const requeridos = permisosRequeridos.flat();

  return async (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({ status: 401, message: 'Usuario no autenticado' });
      }
      if (req.usuario.rol === ROLES.ADMIN) return next();

      const permisos = await permisosDelRol(req.usuario.rol);
      if (requeridos.some((p) => permisos.has(p))) return next();

      // Ver verificarRol: el mensaje no nombra el permiso que falta.
      return res.status(403).json({ status: 403, message: 'No tienes los permisos requeridos' });
    } catch (error) {
      console.error('Error en verificarPermiso:', error);
      return res.status(500).json({ status: 500, message: 'Error en la verificación de permisos' });
    }
  };
};

/**
 * Autoriza por permiso O por rol, lo que se cumpla primero.
 *
 * La parte de `roles` existe para no cambiar quién puede hacer qué al activar los permisos:
 * son los ids que la ruta ya exigía. Los permisos SUMAN acceso, nunca lo quitan, así que
 * activar esto no rompe a nadie -- y un rol nuevo al que se le otorgue el permiso
 * correspondiente entra sin tener que tocar el código de las rutas.
 *
 * @param {Object} opciones
 * @param {string[]} opciones.permisos - Cualquiera de estos permisos autoriza.
 * @param {number[]} [opciones.roles] - Ids de rol que autorizan igualmente (compatibilidad).
 */
const verificarAcceso = ({ permisos = [], roles = [] }) => async (req, res, next) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({ status: 401, message: 'Usuario no autenticado' });
    }
    if (req.usuario.rol === ROLES.ADMIN || roles.includes(req.usuario.rol)) return next();

    const delRol = await permisosDelRol(req.usuario.rol);
    if (permisos.some((p) => delRol.has(p))) return next();

    return res.status(403).json({ status: 403, message: 'No tienes los permisos requeridos' });
  } catch (error) {
    console.error('Error en verificarAcceso:', error);
    return res.status(500).json({ status: 500, message: 'Error en la verificación de permisos' });
  }
};

/**
 * ====================================================
 * verificarTokenOpcional - Middleware opcional
 * ====================================================
 */
const verificarTokenOpcional = async (req, res, next) => {
  try {
    const token = extraerBearer(req);

    if (token) {
      try {
        const decoded = verificarJwt(token, TIPO_ACCESS);
        req.usuario = decoded;
      } catch (error) {
        // Si el token es inválido, simplemente ignoramos
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * ====================================================
 * generarToken - Genera un JWT
 * ====================================================
 */
const generarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
      tipo: TIPO_ACCESS,
      // Marca de tiempo del último cambio de contraseña en el momento de emitir este
      // token -- ver verificarToken. 0 si nunca la cambió.
      pwdTs: usuario.fecha_cambio_contrasena ? new Date(usuario.fecha_cambio_contrasena).getTime() : 0,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, algorithm: JWT_ALGORITMOS[0] }
  );
};

/**
 * ====================================================
 * generarRefreshToken - Genera un refresh token
 * ====================================================
 */
const generarRefreshToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario.id,
      tipo: TIPO_REFRESH,
      pwdTs: usuario.fecha_cambio_contrasena ? new Date(usuario.fecha_cambio_contrasena).getTime() : 0,
    },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN, algorithm: JWT_ALGORITMOS[0] }
  );
};

/**
 * Verifica un refresh token (firma, expiración y que sea de tipo refresh).
 * @param {string} token
 * @returns {Object} payload
 */
const verificarRefreshToken = (token) => verificarJwt(token, TIPO_REFRESH);

module.exports = {
  verificarToken,
  verificarRol,
  verificarPermiso,
  verificarAcceso,
  permisosDelRol,
  invalidarCachePermisos,
  verificarTokenOpcional,
  generarToken,
  generarRefreshToken,
  verificarRefreshToken,
};