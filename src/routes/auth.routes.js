const router = require('express').Router();
const authCtrl = require('../controllers/auth.controller');
const { verificarToken } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Límite de intentos de login/registro
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 peticiones por IP
  message: { status: 429, message: 'Demasiadas solicitudes, intente más tarde' },
});

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints de autenticación y autorización
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión en el sistema
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
 *                 format: password
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login',
  authLimiter,
  [
    body('correo').isEmail().withMessage('Correo inválido'),
    body('contrasena').notEmpty().withMessage('Contraseña requerida'),
  ],
  authCtrl.login
);

/**
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
 *         description: Usuario registrado
 *       400:
 *         description: Validación fallida
 *       409:
 *         description: Correo ya registrado
 */
router.post('/registro',
  authLimiter,
  [
    body('correo').isEmail().withMessage('Correo inválido'),
    body('contrasena').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('numero').optional().isMobilePhone('any').withMessage('Número de teléfono inválido'),
  ],
  authCtrl.registro
);

/**
 * @swagger
 * /api/auth/verificar:
 *   get:
 *     summary: Verificar token JWT
 *     tags: [Autenticación]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 */
router.get('/verificar', verificarToken, authCtrl.verificar);

/**
 * @swagger
 * /api/auth/renovar:
 *   post:
 *     summary: Renovar token de acceso
 *     tags: [Autenticación]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Nuevo token generado
 */
router.post('/renovar', verificarToken, authCtrl.renovarToken);

module.exports = router;