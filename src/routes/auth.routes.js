const router = require('express').Router();
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
 */


router.post(
  '/login',
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
 *                 description: "1=Administrador, 2=Vigilante, 3=Conductor (el registro público ignora este campo; siempre queda en 3=Conductor)"
 *               tipo_documento:
 *                 type: string
 *                 enum: [CC, CE, TI, PASAPORTE, PEP, NIT]
 *                 description: >
 *                   Opcional (también acepta tipoDocumento). Si se envía junto con
 *                   numero_documento, crea un Conductor vinculado a la cuenta nueva en la
 *                   misma transacción (409 si el documento ya está registrado).
 *               numero_documento:
 *                 type: string
 *                 description: Opcional (también acepta numeroDocumento). Debe enviarse junto con tipo_documento.
 *               tipo_usuario_id:
 *                 type: integer
 *                 description: >
 *                   Perfil dentro del SENA (Aprendiz/Instructor/Administrativo), del catálogo
 *                   GET /api/catalogos/tipos-usuario. Opcional: si no se envía, el conductor
 *                   queda sin perfil asignado y se completa después.
 *               direccion:
 *                 type: string
 *                 description: Opcional. Se guarda en el conductor que se crea con el registro.
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Validación fallida, o tipo_documento/numero_documento incompletos/inválidos
 *       409:
 *         description: Correo, teléfono o documento ya registrados
 */

router.post(
  '/registro',
  registerValidation,
  validate,
  authCtrl.register
);

// =============================================
// DISPONIBILIDAD (correo/número) — validación en tiempo real del registro
// =============================================

/**
 * @swagger
 * /api/auth/existe-correo:
 *   get:
 *     summary: Verifica si un correo ya está registrado (validación en vivo del formulario de registro)
 *     tags: [Autenticación]
 *     parameters:
 *       - in: query
 *         name: correo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "{ existe: boolean }"
 *       400:
 *         description: Falta el parámetro correo
 */
router.get(
  '/existe-correo',
  authCtrl.existeCorreo
);

/**
 * @swagger
 * /api/auth/perfil:
 *   get:
 *     summary: Perfil completo del usuario autenticado, con sus permisos
 *     description: >
 *       Todo lo que la aplicación necesita al arrancar en una sola llamada: datos de la
 *       cuenta, documento (del Conductor vinculado, si tiene), nombre real del rol y la
 *       lista de permisos con la que decidir qué pestañas mostrar. Los permisos se leen en
 *       vivo de rol_permiso, así que uno otorgado hace un momento aparece sin necesidad de
 *       volver a iniciar sesión.
 *     tags: [Autenticación]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     correo:
 *                       type: string
 *                     rol_id:
 *                       type: integer
 *                     rol_nombre:
 *                       type: string
 *                     tipo_documento:
 *                       type: string
 *                       nullable: true
 *                     numero_documento:
 *                       type: string
 *                       nullable: true
 *                     permisos:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: [parqueaderos.consultar, reservas.gestionar]
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get(
  '/perfil',
  verificarToken,
  authCtrl.perfil
);

/**
 * @swagger
 * /api/auth/existe-numero:
 *   get:
 *     summary: Verifica si un número de teléfono ya está registrado (validación en vivo del formulario de registro)
 *     tags: [Autenticación]
 *     parameters:
 *       - in: query
 *         name: numero
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "{ existe: boolean }"
 *       400:
 *         description: Falta el parámetro numero
 */
router.get(
  '/existe-numero',
  authCtrl.existeNumero
);

/**
 * @swagger
 * /api/auth/existe-documento:
 *   get:
 *     summary: Verifica si un documento (tipo + número) ya pertenece a un conductor registrado (validación en vivo del formulario de registro)
 *     tags: [Autenticación]
 *     parameters:
 *       - in: query
 *         name: tipoDocumento
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CC, CE, TI, PASAPORTE, PEP, NIT]
 *       - in: query
 *         name: numeroDocumento
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "{ existe: boolean }"
 *       400:
 *         description: Faltan parámetros
 */
router.get(
  '/existe-documento',
  authCtrl.existeDocumento
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
// RECUPERACIÓN DE CONTRASEÑA
// =============================================

/**
 * @swagger
 * /api/auth/recuperar-password:
 *   post:
 *     summary: Solicitar un token de recuperación de contraseña
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Si el correo existe, se generó un token (se envía por correo en producción)
 */
router.post(
  '/recuperar-password',
  authCtrl.recuperarPassword
);

/**
 * @swagger
 * /api/auth/restablecer-password:
 *   post:
 *     summary: Restablecer la contraseña usando un token de recuperación
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - nuevaContrasena
 *             properties:
 *               token:
 *                 type: string
 *               nuevaContrasena:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *       400:
 *         description: Token inválido, ya usado, expirado, o contraseña muy corta
 */
router.post(
  '/restablecer-password',
  authCtrl.restablecerPassword
);

// =============================================
// VERIFICACIÓN DE CORREO
// =============================================

/**
 * @swagger
 * /api/auth/verificar-correo:
 *   get:
 *     summary: Confirma el token enviado por correo y marca la cuenta como verificada
 *     tags: [Autenticación]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Correo verificado correctamente
 *       400:
 *         description: Token inválido, ya usado, o expirado
 */
router.get(
  '/verificar-correo',
  authCtrl.verificarCorreo
);

/**
 * @swagger
 * /api/auth/verificar-codigo:
 *   post:
 *     summary: Confirma el código de 6 dígitos enviado por correo y marca la cuenta como verificada
 *     description: >
 *       Alternativa al enlace, para apps donde el usuario escribe el código.
 *       Ambos salen de la misma solicitud: usar uno invalida el otro.
 *       Tras 5 intentos fallidos el código se quema y hay que pedir uno nuevo
 *       en /api/auth/reenviar-verificacion.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - codigo
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: usuario@correo.com
 *               codigo:
 *                 type: string
 *                 description: 6 dígitos. Se ignoran espacios y guiones.
 *                 example: "482917"
 *     responses:
 *       200:
 *         description: Correo verificado correctamente
 *       400:
 *         description: Código inválido, expirado, o intentos agotados
 */
router.post(
  '/verificar-codigo',
  authCtrl.verificarCodigo
);

/**
 * @swagger
 * /api/auth/reenviar-verificacion:
 *   post:
 *     summary: Reenvía el correo de verificación (invalida cualquier enlace anterior sin usar)
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Si el correo existe y no está verificado, se envía un nuevo enlace
 */
router.post(
  '/reenviar-verificacion',
  authCtrl.reenviarVerificacion
);

// =============================================
// EXPORTAR ROUTER
// =============================================

module.exports = router;