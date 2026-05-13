/**
 * @module AuthMiddleware
 * @description Middleware de autenticación y autorización basado en JWT
 */

const jwt = require('jsonwebtoken');

/**
 * Verifica el token JWT en el header Authorization
 * @middleware
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
const verificarToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        status: 401,
        message: 'Token no proporcionado' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_parku');
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      status: 401,
      message: 'Token inválido o expirado' 
    });
  }
};

/**
 * Verifica que el usuario tenga un rol específico
 * @middleware
 * @param {string|string[]} rolesRequeridos - Rol o roles permitidos
 */
const verificarRol = (rolesRequeridos) => {
  return (req, res, next) => {
    try {
      const rolesArray = Array.isArray(rolesRequeridos) ? rolesRequeridos : [rolesRequeridos];
      
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
      return res.status(500).json({ 
        status: 500,
        message: 'Error en la verificación de rol' 
      });
    }
  };
};

/**
 * Genera un JWT con los datos del usuario
 * @param {Object} usuario - Datos del usuario
 * @returns {string} Token JWT
 */
const generarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario.id,
      correo: usuario.correo,
      nombre: usuario.nombre,
      rol: usuario.rol
    },
    process.env.JWT_SECRET || 'secret_key_parku',
    { expiresIn: '24h' }
  );
};

module.exports = { verificarToken, verificarRol, generarToken };