const router = require('express').Router();
const ctrl = require('../controllers/conductor.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Conductores
 *   description: Gestión de perfiles de conductores y su información asociada
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Conductor:
 *       type: object
 *       required:
 *         - nombre
 *         - tipo_documento
 *         - documento
 *         - perfil
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental del conductor.
 *         nombre:
 *           type: string
 *           description: Nombre completo del conductor.
 *         tipo_documento:
 *           type: string
 *           enum: [CC, CE, PAS, TI, NIT]
 *           description: Tipo de documento de identidad.
 *         documento:
 *           type: integer
 *           description: Número de documento (único).
 *         licencia:
 *           type: string
 *           nullable: true
 *           description: Número de licencia de conducción.
 *         correo:
 *           type: string
 *           format: email
 *           nullable: true
 *           description: Correo electrónico.
 *         numero:
 *           type: string
 *           nullable: true
 *           description: Número telefónico.
 *         perfil:
 *           type: integer
 *           description: ID del perfil institucional (referencia a tabla perfil).
 *         estado:
 *           type: boolean
 *           default: true
 *           description: Estado del conductor (activo/inactivo).
 *         perfil_nombre:
 *           type: string
 *           description: Nombre del perfil (solo en respuestas con JOIN).
 *     ConductorCreate:
 *       type: object
 *       required:
 *         - nombre
 *         - tipo_documento
 *         - documento
 *         - perfil
 *       properties:
 *         nombre:
 *           type: string
 *         tipo_documento:
 *           type: string
 *           enum: [CC, CE, PAS, TI, NIT]
 *         documento:
 *           type: integer
 *         licencia:
 *           type: string
 *           nullable: true
 *         correo:
 *           type: string
 *           format: email
 *           nullable: true
 *         numero:
 *           type: string
 *           nullable: true
 *         perfil:
 *           type: integer
 *         estado:
 *           type: boolean
 *           default: true
 *     ConductorUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *         tipo_documento:
 *           type: string
 *           enum: [CC, CE, PAS, TI, NIT]
 *         documento:
 *           type: integer
 *         licencia:
 *           type: string
 *           nullable: true
 *         correo:
 *           type: string
 *           format: email
 *           nullable: true
 *         numero:
 *           type: string
 *           nullable: true
 *         perfil:
 *           type: integer
 *         estado:
 *           type: boolean
 */

/**
 * @swagger
 * /api/conductores:
 *   get:
 *     summary: Obtiene todos los conductores
 *     tags: [Conductores]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de conductores obtenida con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conductor'
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get('/',
  verificarToken,
  ctrl.getAll
);

/**
 * @swagger
 * /api/conductores/activos:
 *   get:
 *     summary: Obtiene solo los conductores activos
 *     tags: [Conductores]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de conductores con estado = true
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conductor'
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get('/activos',
  verificarToken,
  ctrl.getActivos
);

/**
 * @swagger
 * /api/conductores/documento/{documento}:
 *   get:
 *     summary: Busca un conductor por su número de documento
 *     tags: [Conductores]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documento
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número de documento
 *     responses:
 *       200:
 *         description: Conductor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conductor'
 *       401:
 *         description: No autorizado - Token requerido
 *       404:
 *         description: No existe conductor con ese documento
 */
router.get('/documento/:documento',
  verificarToken,
  ctrl.getByDocumento
);

/**
 * @swagger
 * /api/conductores/correo/{correo}:
 *   get:
 *     summary: Busca conductores por correo electrónico
 *     tags: [Conductores]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: correo
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Correo electrónico
 *     responses:
 *       200:
 *         description: Lista de conductores con ese correo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conductor'
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get('/correo/:correo',
  verificarToken,
  ctrl.getByCorreo
);

/**
 * @swagger
 * /api/conductores/{id}:
 *   get:
 *     summary: Obtiene un conductor por su ID
 *     tags: [Conductores]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del registro de conductor
 *     responses:
 *       200:
 *         description: Datos del conductor encontrados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conductor'
 *       401:
 *         description: No autorizado - Token requerido
 *       404:
 *         description: Conductor no encontrado
 */
router.get('/:id',
  verificarToken,
  ctrl.getById
);

/**
 * @swagger
 * /api/conductores:
 *   post:
 *     summary: Registra un nuevo conductor
 *     tags: [Conductores]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConductorCreate'
 *     responses:
 *       201:
 *         description: Conductor creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conductor'
 *       400:
 *         description: Datos inválidos o faltantes
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       409:
 *         description: Documento o correo ya registrado
 */
router.post('/',
  verificarToken,
  verificarRol([1, 2]), // Admin (1) o Supervisor (2)
  ctrl.create
);

/**
 * @swagger
 * /api/conductores/{id}:
 *   put:
 *     summary: Actualiza la información de un conductor
 *     tags: [Conductores]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConductorUpdate'
 *     responses:
 *       200:
 *         description: Conductor actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conductor'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       404:
 *         description: Registro no encontrado
 */
router.put('/:id',
  verificarToken,
  verificarRol([1, 2]), // Admin (1) o Supervisor (2)
  ctrl.update
);

/**
 * @swagger
 * /api/conductores/{id}:
 *   delete:
 *     summary: Elimina un registro de conductor
 *     tags: [Conductores]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor a eliminar
 *     responses:
 *       204:
 *         description: Registro eliminado correctamente
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Conductor no encontrado
 */
router.delete('/:id',
  verificarToken,
  verificarRol([1]), // Solo Admin (1)
  ctrl.remove
);

module.exports = router;