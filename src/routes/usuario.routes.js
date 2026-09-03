const router = require('express').Router();
const ctrl = require('../controllers/usuario.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { crearUploadMiddleware } = require('../middlewares/upload.middleware');

const uploadFoto = crearUploadMiddleware({
  subcarpeta: 'perfiles',
  extensionesPermitidas: ['jpg', 'jpeg', 'png', 'webp'],
  limiteMB: 5,
  campo: 'foto',
});

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gestión de cuentas, autenticación y seguridad de acceso
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       required:
 *         - correo
 *         - contrasena
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental del usuario.
 *         correo:
 *           type: string
 *           format: email
 *           description: Correo electrónico único.
 *         contrasena:
 *           type: string
 *           description: Contraseña encriptada (no visible en respuestas).
 *         rol:
 *           type: integer
 *           description: ID del rol asignado (rol_id en la base de datos).
 *         numero_telefonico:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: string
 *           enum: [ACTIVO, INACTIVO, BLOQUEADO]
 *           default: ACTIVO
 *         foto_perfil_url:
 *           type: string
 *           nullable: true
 *           description: Ruta pública de la foto de perfil (ver PUT /api/usuarios/foto).
 *         correo_verificado:
 *           type: boolean
 *           description: >
 *             Distinto de "correo con formato válido": solo es true si el usuario abrió el
 *             enlace de verificación enviado a su correo. No bloquea ninguna operación hoy.
 *         tipo_documento:
 *           type: string
 *           nullable: true
 *           description: Del Conductor vinculado a este usuario, si existe (GET /api/usuarios/:id).
 *         numero_documento:
 *           type: string
 *           nullable: true
 *           description: Del Conductor vinculado a este usuario, si existe (GET /api/usuarios/:id).
 *     UsuarioCreate:
 *       type: object
 *       required:
 *         - nombre
 *         - correo
 *         - contrasena
 *       properties:
 *         nombre:
 *           type: string
 *         correo:
 *           type: string
 *           format: email
 *         contrasena:
 *           type: string
 *         numero_telefonico:
 *           type: string
 *           nullable: true
 *           description: Validado en backend (7-15 dígitos, '+' opcional). Único por cuenta.
 *         rol:
 *           type: integer
 *           default: 3
 *           description: >
 *             ID del rol (1=Administrador, 2=Vigilante, 3=Conductor) o su nombre
 *             ("Administrador"/"Vigilante"/"Conductor", sin distinguir mayúsculas).
 *             También se acepta como `rol_id`. Si se omite, queda en Conductor.
 *         tipo_documento:
 *           type: string
 *           enum: [CC, CE, TI, PASAPORTE, PEP, NIT]
 *           description: >
 *             Opcional (también acepta `tipoDocumento`). Si se envía junto con
 *             numero_documento, crea un Conductor vinculado a este usuario en la misma
 *             transacción (409 si el documento ya existe).
 *         numero_documento:
 *           type: string
 *           description: Opcional (también acepta `numeroDocumento`). Debe enviarse junto con tipo_documento.
 *     UsuarioUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *         correo:
 *           type: string
 *           format: email
 *         numero_telefonico:
 *           type: string
 *           nullable: true
 *         rol:
 *           type: integer
 *           description: Mismo formato que en UsuarioCreate (id, nombre, o `rol_id`).
 *         estado:
 *           type: string
 *           enum: [ACTIVO, INACTIVO, BLOQUEADO]
 *         tipo_documento:
 *           type: string
 *           enum: [CC, CE, TI, PASAPORTE, PEP, NIT]
 *           description: >
 *             Opcional (también acepta `tipoDocumento`). Si el usuario ya tiene un
 *             Conductor vinculado, actualiza su documento; si no, crea uno nuevo. Debe
 *             enviarse junto con numero_documento (409 si el documento ya pertenece a otro
 *             conductor).
 *         numero_documento:
 *           type: string
 *           description: Opcional (también acepta `numeroDocumento`). Debe enviarse junto con tipo_documento.
 */

// El login vive únicamente en POST /api/auth/login (auth.routes.js): es el único que
// aplica rate limiting, valida `estado` y emite JWT. No duplicar aquí.

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Listar todos los usuarios
 *     tags: [Usuarios]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 */
router.get('/',
  verificarToken,
  verificarRol([1]), // Solo Admin (1)
  ctrl.getAll
);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del usuario encontrados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id',
  verificarToken,
  verificarRol([1]), // Solo Admin (1)
  ctrl.getById
);

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Usuarios]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioCreate'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Datos inválidos o faltantes
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       409:
 *         description: El correo ya está registrado
 */
router.post('/',
  verificarToken,
  verificarRol([1]), // Solo Admin (1)
  ctrl.create
);

/**
 * @swagger
 * /api/usuarios/foto:
 *   put:
 *     summary: Actualizar la foto de perfil del usuario autenticado
 *     description: >
 *       Self-service: siempre actúa sobre el propio usuario del token, cualquier rol.
 *       multipart/form-data con el archivo en el campo "foto". Reemplaza y borra del
 *       disco la foto anterior si existía. Persiste en BD (foto_perfil_url), no es
 *       almacenamiento temporal.
 *     tags: [Usuarios]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               foto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Usuario con la nueva foto_perfil_url
 *       400:
 *         description: Falta el archivo, extensión no permitida o excede el tamaño máximo (5MB)
 *       401:
 *         description: No autorizado - Token requerido
 */
router.put('/foto',
  verificarToken,
  uploadFoto,
  ctrl.actualizarFoto
);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar datos de perfil (parcial o total)
 *     tags: [Usuarios]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioUpdate'
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: El correo ya está en uso
 */
router.put('/:id',
  verificarToken,
  verificarRol([1]), // Solo Admin (1)
  ctrl.update
);

/**
 * @swagger
 * /api/usuarios/{id}/contrasena:
 *   patch:
 *     summary: Cambiar contraseña de usuario
 *     tags: [Usuarios]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actual
 *               - nueva
 *             properties:
 *               actual:
 *                 type: string
 *               nueva:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *       400:
 *         description: Faltan datos
 *       401:
 *         description: No autorizado - Token requerido o contraseña incorrecta
 *       403:
 *         description: Prohibido - No puedes cambiar contraseña de otro usuario
 *       404:
 *         description: Usuario no encontrado
 */
router.patch('/:id/contrasena',
  verificarToken,
  ctrl.cambiarContrasena
);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Eliminar una cuenta de usuario
 *     tags: [Usuarios]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Usuario eliminado
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/:id',
  verificarToken,
  verificarRol([1]), // Solo Admin (1)
  ctrl.remove
);

module.exports = router;