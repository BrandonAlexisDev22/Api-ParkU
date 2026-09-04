const router = require('express').Router();
const ctrl = require('../controllers/rol.controller');
const { verificarToken, verificarAcceso } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Gestión de niveles de acceso y tipos de cuenta
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Rol:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental del rol.
 *         nombre:
 *           type: string
 *           description: Nombre del rol (ej. "admin", "operador", "usuario").
 *     RolCreate:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         nombre:
 *           type: string
 *     RolUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Obtiene todos los roles
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles obtenida
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Rol'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 */
router.get('/',
  verificarToken,
  verificarAcceso({ permisos: ['configuracion.gestionar'], roles: [1] }),
  ctrl.getAll
);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Obtiene un rol por ID
 *     tags: [Roles]
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
 *         description: Datos del rol
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rol'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Rol no encontrado
 */
router.get('/:id',
  verificarToken,
  verificarAcceso({ permisos: ['configuracion.gestionar'], roles: [1] }),
  ctrl.getById
);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Crea un nuevo rol
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RolCreate'
 *     responses:
 *       201:
 *         description: Rol creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rol'
 *       400:
 *         description: Datos inválidos o faltantes
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       409:
 *         description: El nombre del rol ya existe
 */
router.post('/',
  verificarToken,
  verificarAcceso({ permisos: ['configuracion.gestionar'], roles: [1] }),
  ctrl.create
);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Actualiza un rol (parcial o total)
 *     tags: [Roles]
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
 *             $ref: '#/components/schemas/RolUpdate'
 *     responses:
 *       200:
 *         description: Rol actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rol'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Rol no encontrado
 *       409:
 *         description: Conflicto - nombre duplicado
 */
router.put('/:id',
  verificarToken,
  verificarAcceso({ permisos: ['configuracion.gestionar'], roles: [1] }),
  ctrl.update
);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Elimina un rol
 *     tags: [Roles]
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
 *         description: Rol eliminado correctamente
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Rol no encontrado
 *       409:
 *         description: No se puede eliminar porque está asignado a algún usuario
 */
router.delete('/:id',
  verificarToken,
  verificarAcceso({ permisos: ['configuracion.gestionar'], roles: [1] }),
  ctrl.remove
);

// Documentación Swagger en el controller (ctrl.reemplazarPermisos).
router.put('/:id/permisos',
  verificarToken,
  verificarAcceso({ permisos: ['configuracion.gestionar'], roles: [1] }),
  ctrl.reemplazarPermisos
);

module.exports = router;