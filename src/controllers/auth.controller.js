const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const PasswordUtil = require('../utils/password.util');
const { Usuario } = require('../models');
const { generarToken, generarRefreshToken } = require('../middlewares/auth.middleware');

class AuthController {
  /**
   * POST /api/auth/registro - Registro de usuario
   */
  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map(err => ({
            field: err.param,
            message: err.msg
          }))
        });
      }

      const { correo, contrasena, nombre, numero } = req.body;
      // 🔒 El rol NUNCA se toma del body. Todo registro público es rol=3 (Usuario).
      // Si necesitas crear Admins/Supervisores, hazlo desde un endpoint protegido
      // (verificarToken + verificarRol([1])), no desde el registro público.
      const rol = 1;

      // Verificar si el correo ya existe
      const existe = await Usuario.findOne({ where: { correo } });
      if (existe) {
        return res.status(400).json({
          success: false,
          message: 'El correo ya está registrado'
        });
      }

      // Encriptar contraseña
      const hashedPassword = await PasswordUtil.hash(contrasena);

      // Crear usuario (ahora sí se guardan nombre y numero)
      const nuevo = await Usuario.create({
        correo,
        contrasena: hashedPassword,
        nombre,
        numero,
        rol,
        estado: true,
      });

      return res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          id: nuevo.id,
          correo: nuevo.correo,
          nombre: nuevo.nombre,
          numero: nuevo.numero,
          rol: nuevo.rol,
          estado: nuevo.estado,
        }
      });
    } catch (error) {
      console.error('Error en register:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * POST /api/auth/login - Inicio de sesión
   */
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map(err => ({
            field: err.param,
            message: err.msg
          }))
        });
      }

      const { correo, contrasena } = req.body;

      // Buscar usuario
      const user = await Usuario.findOne({ where: { correo } });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      if (!user.estado) {
        return res.status(403).json({
          success: false,
          message: 'Usuario inactivo. Contacte al administrador'
        });
      }

      // Verificar contraseña
      const isPasswordValid = await PasswordUtil.compare(contrasena, user.contrasena);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Generar tokens
      const payload = {
        id: user.id,
        correo: user.correo,
        rol: user.rol
      };

      const token = generarToken(payload);
      const refreshToken = generarRefreshToken(payload);

      // Guardar refresh token en BD
      await user.update({ refresh_token: refreshToken });

      // Respuesta sin datos sensibles
      return res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: {
            id: user.id,
            correo: user.correo,
            nombre: user.nombre,
            rol: user.rol,
            estado: user.estado,
          },
          token,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/auth/verificar - Verificar token JWT
   */
  static async verificar(req, res) {
    try {
      // El middleware verificarToken ya validó el token
      // y guardó el usuario en req.usuario
      return res.status(200).json({
        success: true,
        message: 'Token válido',
        data: {
          usuario: req.usuario
        }
      });
    } catch (error) {
      console.error('Error en verificar:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * POST /api/auth/refresh-token - Renovar token de acceso
   */
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token requerido'
        });
      }

      // Verificar refresh token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Refresh token expirado. Inicia sesión nuevamente'
          });
        }
        return res.status(401).json({
          success: false,
          message: 'Refresh token inválido'
        });
      }

      // Verificar que el refresh token coincida con el guardado
      const user = await Usuario.findOne({
        where: { id: decoded.id, refresh_token: refreshToken }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token inválido'
        });
      }

      // Generar nuevo token
      const newToken = generarToken({
        id: user.id,
        correo: user.correo,
        rol: user.rol
      });

      return res.status(200).json({
        success: true,
        data: {
          token: newToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
      });
    } catch (error) {
      console.error('Error en refreshToken:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * POST /api/auth/logout - Cerrar sesión
   */
  static async logout(req, res) {
    try {
      const userId = req.usuario?.id;

      if (userId) {
        await Usuario.update({ refresh_token: null }, { where: { id: userId } });
      }

      return res.status(200).json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      console.error('Error en logout:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al cerrar sesión'
      });
    }
  }
}

module.exports = AuthController;