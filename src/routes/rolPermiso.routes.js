const router = require('express').Router();
const ctrl   = require('../controllers/rolPermiso.controller');

/**
 * @swagger
 * tags:
 *   name: Asignación de Permisos
 *   description: Endpoints para gestionar la relación Muchos a Muchos entre Roles y Permisos
 */

/**
 * @swagger
 * /api/roles-permisos:
 *   get:
 *     summary: Obtiene todas las asociaciones rol-permiso
 *     tags: [Asignación de Permisos]
 *     responses:
 *       200:
 *         description: Listado completo de asignaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RolPermiso'
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/roles-permisos/rol/{rolId}:
 *   get:
 *     summary: Obtiene los permisos asociados a un rol específico
 *     tags: [Asignación de Permisos]
 *     parameters:
 *       - in: path
 *         name: rolId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol para consultar sus capacidades
 *     responses:
 *       200:
 *         description: Lista de permisos del rol solicitado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RolPermiso'
 *       404:
 *         description: Rol no encontrado
 */
router.get('/rol/:rolId', ctrl.getByRol);

/**
 * @swagger
 * /api/roles-permisos:
 *   post:
 *     summary: Asigna un permiso a un rol
 *     tags: [Asignación de Permisos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rol
 *               - permiso
 *             properties:
 *               rol:
 *                 type: integer
 *                 description: ID del rol
 *               permiso:
 *                 type: integer
 *                 description: ID del permiso a otorgar
 *                 example: 3
 *     responses:
 *       201:
 *         description: Asignación creada exitosamente
 *       400:
 *         description: Faltan campos requeridos
 *       404:
 *         description: El rol o el permiso no existen
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/roles-permisos/{id}:
 *   delete:
 *     summary: Revoca un permiso de un rol (Elimina la asociación)
 *     tags: [Asignación de Permisos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la relación en la tabla intermedia
 *     responses:
 *       204:
 *         description: Permiso revocado correctamente
 *       404:
 *         description: Registro no encontrado
 */
router.delete('/:id', ctrl.remove);

module.exports = router;