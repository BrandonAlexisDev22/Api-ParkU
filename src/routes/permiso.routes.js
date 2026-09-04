const router = require('express').Router();
const ctrl = require('../controllers/permiso.controller');
const { verificarToken, verificarAcceso } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Permisos
 *   description: Definición de acciones atómicas del sistema (RBAC)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Permiso:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del permiso
 *         nombre:
 *           type: string
 *           description: Nombre del permiso
 *     PermisoCreate:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         nombre:
 *           type: string
 *     PermisoUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 */

/**
 * @swagger
 * /api/permisos:
 *   get:
 *     summary: Obtiene la lista de todos los permisos definidos
 *     tags: [Permisos]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de permisos obtenida con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Permiso'
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
 * /api/permisos/{id}:
 *   get:
 *     summary: Obtiene un permiso por su ID
 *     tags: [Permisos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del permiso
 *     responses:
 *       200:
 *         description: Detalle del permiso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Permiso'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Permiso no encontrado
 */
router.get('/:id',
  verificarToken,
  verificarAcceso({ permisos: ['configuracion.gestionar'], roles: [1] }),
  ctrl.getById
);

/**
 * @swagger
 * /api/permisos:
 *   post:
 *     summary: Crea un nuevo permiso
 *     description: El nombre debe ser único y preferiblemente en mayúsculas (ej. "EDITAR_USUARIOS").
 *     tags: [Permisos]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PermisoCreate'
 *     responses:
 *       201:
 *         description: Permiso creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Permiso'
 *       400:
 *         description: Datos inválidos o nombre faltante
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       409:
 *         description: Ya existe un permiso con ese nombre
 */
router.post('/',
  verificarToken,
  verificarAcceso({ permisos: ['configuracion.gestionar'], roles: [1] }),
  ctrl.create
);

/**
 * @swagger
 * /api/permisos/{id}:
 *   put:
 *     summary: Actualiza el nombre de un permiso (parcial o total)
 *     tags: [Permisos]
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
 *             $ref: '#/components/schemas/PermisoUpdate'
 *     responses:
 *       200:
 *         description: Permiso actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Permiso'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Permiso no encontrado
 *       409:
 *         description: El nombre ya está en uso por otro permiso
 */
router.put('/:id',
  verificarToken,
  verificarAcceso({ permisos: ['configuracion.gestionar'], roles: [1] }),
  ctrl.update
);

/**
 * @swagger
 * /api/permisos/{id}:
 *   delete:
 *     summary: Elimina un permiso del sistema
 *     tags: [Permisos]
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
 *         description: Permiso eliminado correctamente
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Permiso no encontrado
 *       409:
 *         description: No se puede eliminar porque está asignado a algún rol
 */
router.delete('/:id',
  verificarToken,
  verificarAcceso({ permisos: ['configuracion.gestionar'], roles: [1] }),
  ctrl.remove
);

module.exports = router;