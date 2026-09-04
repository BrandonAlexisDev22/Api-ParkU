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

/**
 * ====================================================
 * verificarToken - Middleware de autenticación
 * ====================================================
 */
const verificarToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 401,
        message: 'Token no proporcionado'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
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
          message: 'No tienes permiso para acceder a este recurso'
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

      return res.status(403).json({
        status: 403,
        message: `No tienes el permiso requerido: ${requeridos.join(' o ')}`,
      });
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

    return res.status(403).json({
      status: 403,
      message: `No tienes el permiso requerido: ${permisos.join(' o ')}`,
    });
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
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
      // Marca de tiempo del último cambio de contraseña en el momento de emitir este
      // token -- ver verificarToken. 0 si nunca la cambió.
      pwdTs: usuario.fecha_cambio_contrasena ? new Date(usuario.fecha_cambio_contrasena).getTime() : 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
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
      correo: usuario.correo,
      rol: usuario.rol,
      pwdTs: usuario.fecha_cambio_contrasena ? new Date(usuario.fecha_cambio_contrasena).getTime() : 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' }
  );
};

module.exports = {
  verificarToken,
  verificarRol,
  verificarPermiso,
  verificarAcceso,
  permisosDelRol,
  invalidarCachePermisos,
  verificarTokenOpcional,
  generarToken,
  generarRefreshToken
};