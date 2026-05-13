const router = require('express').Router();
const authCtrl = require('../controllers/auth.controller');
const { verificarToken } = require('../middleware/auth.middleware');

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
 *                 example: "123456"
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
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     usuario:
 *                       type: object
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', authCtrl.login);

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
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Validación fallida
 *       409:
 *         description: El correo ya está registrado
 */
router.post('/registro', authCtrl.registro);

/**
 * @swagger
 * /api/auth/verificar:
 *   get:
 *     summary: Verificar si el token es válido
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
 *         description: Token renovado
 */
router.post('/renovar', verificarToken, authCtrl.renovarToken);

module.exports = router;