const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');

// =============================================
// CONTROLLERS
// =============================================

const authCtrl = require('../controllers/auth.controller');

// =============================================
// MIDDLEWARES
// =============================================

const { verificarToken } = require('../middlewares/auth.middleware');

// Middleware de validación
const { validate } = require('../middlewares/validators/auth.validator');

// =============================================
// RATE LIMITING
// =============================================

// Límite de intentos de login y registro
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 peticiones por IP
  message: {
    status: 429,
    message: 'Demasiadas solicitudes, intente más tarde',
  },
});

// =============================================
// VALIDACIONES
// =============================================

// Validación de Login
const loginValidation = [
  body('correo')
    .isEmail()
    .withMessage('Correo inválido')
    .normalizeEmail(),

  body('contrasena')
    .notEmpty()
    .withMessage('Contraseña requerida'),
];

// Validación de Registro
const registerValidation = [
  body('correo')
    .isEmail()
    .withMessage('Correo inválido')
    .normalizeEmail(),

  body('contrasena')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe tener al menos una mayúscula')
    .matches(/[a-z]/)
    .withMessage('La contraseña debe tener al menos una minúscula')
    .matches(/[0-9]/)
    .withMessage('La contraseña debe tener al menos un número'),

  body('nombre')
    .notEmpty()
    .withMessage('Nombre requerido'),

  body('numero')
    .optional()
    .isMobilePhone('any')
    .withMessage('Número de teléfono inválido'),
];

// Validación de Refresh Token
const refreshValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token requerido'),
];

// =============================================
// RUTAS DE AUTENTICACIÓN
// =============================================

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints de autenticación y autorización
 */

// =============================================
// LOGIN
// =============================================

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
 *                 example: "admin@parku.com"
 *               contrasena:
 *                 type: string
 *                 format: password
 *                 example: "Admin123"
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 *       429:
 *         description: Demasiadas solicitudes
 */


router.post(
  '/login',
  authLimiter,
  loginValidation,
  validate,
  authCtrl.login
);

// =============================================
// REGISTRO
// =============================================

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
 *                 example: "usuario@parku.com"
 *               contrasena:
 *                 type: string
 *                 minLength: 8
 *                 example: "Password123"
 *               nombre:
 *                 type: string
 *                 example: "Juan Pérez"
 *               numero:
 *                 type: string
 *                 example: "3001234567"
 *               rol:
 *                 type: integer
 *                 example: 3
 *                 description: "1=Vigilante, 2=Admin, 3=Conductor"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Validación fallida
 *       409:
 *         description: Correo ya registrado
 *       429:
 *         description: Demasiadas solicitudes
 */

router.post(
  '/registro',
  authLimiter,
  registerValidation,
  validate,
  authCtrl.register
);

// =============================================
// VERIFICAR TOKEN
// =============================================

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
 *       401:
 *         description: Token inválido o expirado
 */

router.get(
  '/verificar',
  verificarToken,
  authCtrl.verificar
);

// =============================================
// REFRESH TOKEN
// =============================================

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Renovar token de acceso
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nuevo token generado
 *       401:
 *         description: Refresh token inválido o expirado
 */

router.post(
  '/refresh-token',
  authLimiter,
  refreshValidation,
  validate,
  authCtrl.refreshToken
);

// =============================================
// LOGOUT
// =============================================

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Autenticación]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout exitoso
 *       401:
 *         description: Token inválido o expirado
 */

router.post(
  '/logout',
  verificarToken,
  authCtrl.logout
);

// =============================================
// EXPORTAR ROUTER
// =============================================

module.exports = router;