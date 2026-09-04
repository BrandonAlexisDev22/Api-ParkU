const router = require('express').Router();
const ctrl = require('../controllers/usuario.controller');
const { verificarToken, verificarAcceso } = require('../middlewares/auth.middleware');
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
// valida `estado` y emite JWT. No duplicar aquí.

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Listar usuarios, opcionalmente filtrados por rol
 *     description: >
 *       El filtro admite cualquier rol existente en la base de datos, por id o por nombre
 *       (sin distinguir mayúsculas ni tildes). No hay una lista cerrada de roles: un rol
 *       creado con POST /api/roles se puede filtrar de inmediato. Las opciones del
 *       desplegable se obtienen de GET /api/roles.
 *     tags: [Usuarios]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rol
 *         required: false
 *         schema:
 *           type: string
 *         description: 'Id o nombre del rol. Ejemplos: 2, Vigilante, comunidad sena'
 *         example: Vigilante
 *       - in: query
 *         name: rol_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Alias de `rol` para filtrar solo por id.
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida
 *       400:
 *         description: El rol indicado no existe (el mensaje lista los roles disponibles)
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
  verificarAcceso({ permisos: ['usuarios.consultar'], roles: [1] }),
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
/**
 * @swagger
 * /api/usuarios/{id}/vinculacion:
 *   get:
 *     summary: Datos para vincular esta cuenta a un conductor
 *     description: >
 *       Devuelve, en una sola llamada, qué debe precargar el formulario de "Nuevo
 *       conductor" al seleccionar una cuenta de acceso y qué campos debe dejar
 *       bloqueados. `prefill` usa los nombres de campo del CONDUCTOR para poder volcarlo
 *       directo. `campos_solo_lectura` son los que pertenecen a la cuenta (el backend
 *       rechaza con 409 cualquier intento de cambiarlos desde el conductor).
 *       `campos_a_capturar` avisa de lo que la cuenta NO puede aportar -- el documento no
 *       existe hasta que haya un conductor -- para que el formulario no lo espere en vano.
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
 *         description: Datos de vinculación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario:
 *                   $ref: '#/components/schemas/Usuario'
 *                 ya_vinculado:
 *                   type: boolean
 *                 conductor_vinculado:
 *                   type: object
 *                   nullable: true
 *                 prefill:
 *                   type: object
 *                 campos_solo_lectura:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [correo, numero_telefonico]
 *                 campos_a_capturar:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [tipo_documento, numero_documento]
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id/vinculacion',
  verificarToken,
  verificarAcceso({ permisos: ['usuarios.consultar'], roles: [1, 2] }),
  ctrl.getDatosVinculacion
);

/**
 * @swagger
 * /api/usuarios/disponibilidad:
 *   get:
 *     summary: Comprueba si un correo, teléfono o documento ya están ocupados
 *     description: >
 *       Validación "mientras se escribe" para los formularios de cuenta y de conductor.
 *       Mira las dos tablas donde puede estar el dato: usuario (cuentas) y conductor
 *       (personas registradas, que pueden existir sin cuenta), porque un correo libre en
 *       una pero usado en la otra haría fallar el guardado igualmente.
 *       Se puede consultar un campo o los tres a la vez.
 *     tags: [Usuarios]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: correo
 *         schema: { type: string }
 *       - in: query
 *         name: numero_telefonico
 *         schema: { type: string }
 *       - in: query
 *         name: tipo_documento
 *         schema: { type: string, enum: [CC, CE, TI, PASAPORTE, PEP, NIT] }
 *       - in: query
 *         name: numero_documento
 *         schema: { type: string }
 *       - in: query
 *         name: excluir_usuario_id
 *         schema: { type: integer }
 *         description: >
 *           Cuenta que se está editando. Sus propios valores no cuentan como ocupados; sin
 *           esto, editar un usuario sin tocar su correo lo marcaría siempre como repetido.
 *     responses:
 *       200:
 *         description: Un bloque por cada campo consultado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 disponible:
 *                   type: boolean
 *                   description: false si CUALQUIERA de los campos consultados está ocupado.
 *                 correo:
 *                   type: object
 *                   properties:
 *                     valor: { type: string }
 *                     disponible: { type: boolean }
 *                     motivo: { type: string, nullable: true }
 *                     usuario_id: { type: integer, nullable: true }
 *                     conductor_id: { type: integer, nullable: true }
 *                 numero_telefonico:
 *                   type: object
 *                 documento:
 *                   type: object
 *       400:
 *         description: No se envió ningún criterio, o el documento vino incompleto
 *       401:
 *         description: No autorizado - Token requerido
 */
// Antes de GET /:id a propósito: Express casa por orden y '/disponibilidad' encajaría en
// el patrón '/:id', que intentaría buscar el usuario con id "disponibilidad".
router.get('/disponibilidad',
  verificarToken,
  ctrl.disponibilidad
);

router.get('/:id',
  verificarToken,
  verificarAcceso({ permisos: ['usuarios.consultar'], roles: [1] }),
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
  verificarAcceso({ permisos: ['usuarios.gestionar'], roles: [1] }),
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
  verificarAcceso({ permisos: ['usuarios.gestionar'], roles: [1] }),
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
  verificarAcceso({ permisos: ['usuarios.gestionar'], roles: [1] }),
  ctrl.remove
);

module.exports = router;