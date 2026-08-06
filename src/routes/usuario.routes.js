const router = require('express').Router();
const ctrl = require('../controllers/usuario.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

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
 *           description: ID del rol asignado.
 *         estado:
 *           type: boolean
 *           default: true
 *           description: true = Activo, false = Inactivo.
 *         refresh_token:
 *           type: string
 *           nullable: true
 *           description: Token de renovación de sesión.
 *     UsuarioCreate:
 *       type: object
 *       required:
 *         - correo
 *         - contrasena
 *       properties:
 *         correo:
 *           type: string
 *           format: email
 *         contrasena:
 *           type: string
 *         rol:
 *           type: integer
 *           default: 3
 *     UsuarioUpdate:
 *       type: object
 *       properties:
 *         correo:
 *           type: string
 *           format: email
 *         rol:
 *           type: integer
 *         estado:
 *           type: boolean
 */

/**
 * @swagger
 * /api/usuarios/login:
 *   post:
 *     summary: Iniciar sesión en el sistema
 *     tags: [Usuarios]
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
 *                 message:
 *                   type: string
 *                 usuario:
 *                   $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Faltan credenciales
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login',
  ctrl.login
);

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
  verificarRol([2]), // Solo Admin (2)
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
  verificarRol([2]), // Solo Admin (2)
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
  verificarRol([2]), // Solo Admin (2)
  ctrl.create
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
  verificarRol([2]), // Solo Admin (2)
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
  verificarRol([2]), // Solo Admin (2)
  ctrl.remove
);

module.exports = router;