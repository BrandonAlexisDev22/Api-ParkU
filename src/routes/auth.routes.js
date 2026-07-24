const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');

// Controllers
const authCtrl = require('../controllers/auth.controller');

// Middlewares
const { verificarToken } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');

// =============================================
// RATE LIMITING
// =============================================

// Límite de intentos de login/registro
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 peticiones por IP
  message: {
    status: 429,
    message: 'Demasiadas solicitudes, intente más tarde'
  },
});

// =============================================
// VALIDACIONES
// =============================================

const loginValidation = [
  body('correo').isEmail().withMessage('Correo inválido').normalizeEmail(),
  body('contrasena').notEmpty().withMessage('Contraseña requerida'),
];

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

const refreshValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token requerido'),
];

// =============================================
// RUTAS
// =============================================

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
 *                 example: "admin@parku.com"
 *               contrasena:
 *                 type: string
 *                 format: password
 *                 example: "Admin123"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Login exitoso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     usuario:
 *                       type: object
 *       401:
 *         description: Credenciales inválidas
 *       429:
 *         description: Demasiadas solicitudes
 */
router.post('/login',
  authLimiter,
  loginValidation,
  validate,
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
 *                 description: "1=Admin, 2=Supervisor, 3=Usuario"
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
router.post('/registro',
  authLimiter,
  registerValidation,
  validate,
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Token válido"
 *                 usuario:
 *                   type: object
 *       401:
 *         description: Token inválido o expirado
 */
router.get('/verificar',
  verificarToken,
  authCtrl.verificar
);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 token:
 *                   type: string
 *       401:
 *         description: Refresh token inválido o expirado
 */
router.post('/refresh-token',
  refreshValidation,
  validate,
  authCtrl.refreshToken
);

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
router.post('/logout',
  verificarToken,
  authCtrl.logout
);

module.exports = router;