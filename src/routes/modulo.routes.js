const router = require('express').Router();
const ctrl = require('../controllers/modulo.controller');
const { verificarToken, verificarAcceso } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Módulos
 *   description: Catálogo de módulos del sistema, que agrupa los permisos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Modulo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nombre:
 *           type: string
 *           example: Parqueaderos
 *         descripcion:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: boolean
 *         permisos:
 *           type: array
 *           description: Solo con ?con_permisos=true.
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               nombre:
 *                 type: string
 *                 example: parqueaderos.gestionar
 *               descripcion:
 *                 type: string
 *                 nullable: true
 */

/**
 * @swagger
 * /api/modulos:
 *   get:
 *     summary: Lista los módulos del sistema
 *     description: >
 *       Con `?con_permisos=true` devuelve cada módulo con sus permisos anidados: es el
 *       árbol que necesita la pantalla de crear/editar rol para dibujar una sección por
 *       módulo con sus casillas, en una sola petición. Los permisos que hay que marcar
 *       salen de `permiso_ids` en GET /api/roles/{id}, y se guardan con
 *       PUT /api/roles/{id}/permisos.
 *     tags: [Módulos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: con_permisos
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Anida los permisos de cada módulo.
 *     responses:
 *       200:
 *         description: Lista de módulos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Modulo'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Requiere el permiso configuracion.gestionar
 */
router.get('/',
  verificarToken,
  verificarAcceso({ permisos: ['configuracion.gestionar'], roles: [1] }),
  ctrl.getAll
);

/**
 * @swagger
 * /api/modulos/{id}:
 *   get:
 *     summary: Obtiene un módulo por ID
 *     tags: [Módulos]
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
 *         description: Datos del módulo
 *       404:
 *         description: Módulo no encontrado
 */
router.get('/:id',
  verificarToken,
  verificarAcceso({ permisos: ['configuracion.gestionar'], roles: [1] }),
  ctrl.getById
);

module.exports = router;
