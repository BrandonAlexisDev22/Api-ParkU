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
      where: { id: decoded.id, estado: true },
      attributes: ['id', 'correo', 'nombre', 'rol_id', 'estado'],
    });

    if (!user) {
      return res.status(401).json({
        status: 401,
        message: 'Usuario no encontrado o inactivo'
      });
    }

    req.usuario = {
      id: user.id,
      correo: user.correo,
      nombre: user.nombre,
      rol: user.rol_id
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
 * verificarPermiso - Middleware de autorización por permiso
 * ====================================================
 * NOTA: requiere modelos Permiso y RolPermiso (aún no migrados).
 * Si no tienes esas tablas/modelos todavía, no uses este middleware
 * en tus rutas hasta que los creemos.
 * ====================================================
 */
const verificarPermiso = (permisoRequerido) => {
  return async (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          status: 401,
          message: 'Usuario no autenticado'
        });
      }

      const [resultado] = await sequelize.query(
        `SELECT p.nombre
         FROM rol_permiso rp
         INNER JOIN permiso p ON rp.permiso_id = p.id
         WHERE rp.rol_id = :rol AND p.nombre = :permiso`,
        {
          replacements: { rol: req.usuario.rol, permiso: permisoRequerido },
        }
      );

      if (!resultado || resultado.length === 0) {
        return res.status(403).json({
          status: 403,
          message: `No tienes el permiso requerido: ${permisoRequerido}`
        });
      }

      next();
    } catch (error) {
      console.error('Error en verificarPermiso:', error);
      return res.status(500).json({
        status: 500,
        message: 'Error en la verificación de permisos'
      });
    }
  };
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
      rol: usuario.rol
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
      rol: usuario.rol
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' }
  );
};

module.exports = {
  verificarToken,
  verificarRol,
  verificarPermiso,
  verificarTokenOpcional,
  generarToken,
  generarRefreshToken
};