/**
 * @module AuthController
 * @description Controlador de autenticación y autorización
 */

const usuarioSvc = require('../services/usuario.service');
const { generarToken } = require('../middleware/auth.middleware');
const { handleError } = require('../helpers/errorHandler');

/**
 * Registro de nuevo usuario
 * @swagger
 * /api/auth/registro:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - contrasena
 *               - nombre
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *               contrasena:
 *                 type: string
 *                 minLength: 6
 *               nombre:
 *                 type: string
 *               numero:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Validación fallida
 *       409:
 *         description: El correo ya está registrado
 */
const registro = async (req, res) => {
  try {
    const { correo, contrasena, nombre, numero } = req.body;

    // Validaciones básicas
    if (!correo || !contrasena || !nombre) {
      return res.status(400).json({
        status: 400,
        message: 'Correo, contraseña y nombre son requeridos'
      });
    }

    if (contrasena.length < 6) {
      return res.status(400).json({
        status: 400,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Crear usuario
    const usuario = await usuarioSvc.create({
      correo,
      contrasena,
      nombre,
      numero,
      rol: 2 // rol por defecto (conductor/usuario)
    });

    // Generar token
    const token = generarToken(usuario);

    res.status(201).json({
      status: 201,
      message: 'Usuario registrado exitosamente',
      data: {
        usuario,
        token
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Inicio de sesión
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - contrasena
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *               contrasena:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 usuario:
 *                   type: object
 *       401:
 *         description: Credenciales inválidas
 */
const login = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({
        status: 400,
        message: 'Correo y contraseña son requeridos'
      });
    }

    const usuarioData = await usuarioSvc.login(correo, contrasena);
    const token = generarToken(usuarioData);

    res.json({
      status: 200,
      message: 'Login exitoso',
      data: {
        usuario: usuarioData,
        token
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Verificar token actual
 * @swagger
 * /api/auth/verificar:
 *   get:
 *     summary: Verificar token actual
 *     tags: [Autenticación]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 */
const verificar = (req, res) => {
  res.json({
    status: 200,
    message: 'Token válido',
    data: req.usuario
  });
};

/**
 * Renovar token
 * @swagger
 * /api/auth/renovar:
 *   post:
 *     summary: Renovar token de acceso
 *     tags: [Autenticación]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Token renovado exitosamente
 */
const renovarToken = (req, res) => {
  try {
    const token = generarToken(req.usuario);
    res.json({
      status: 200,
      message: 'Token renovado exitosamente',
      data: { token }
    });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  registro,
  login,
  verificar,
  renovarToken
};