const router = require('express').Router();
const ctrl   = require('../controllers/permiso.controller');

/**
 * @swagger
 * tags:
 *   name: Permisos
 *   description: Definición de acciones atómicas del sistema (RBAC)
 */

/**
 * @swagger
 * /api/permisos:
 *   get:
 *     summary: Obtiene la lista de todos los permisos definidos
 *     tags: [Permisos]
 *     responses:
 *       200:
 *         description: Lista de permisos obtenida con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Permiso'
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/permisos/{id}:
 *   get:
 *     summary: Obtiene un permiso por su ID
 *     tags: [Permisos]
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
 *       404:
 *         description: Permiso no encontrado
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/permisos:
 *   post:
 *     summary: Crea un nuevo permiso
 *     description: El nombre debe ser único y preferiblemente en mayúsculas (ej. "EDITAR_USUARIOS").
 *     tags: [Permisos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "CREAR_RESERVA"
 *     responses:
 *       201:
 *         description: Permiso creado exitosamente
 *       400:
 *         description: El nombre es requerido
 *       409:
 *         description: Ya existe un permiso con ese nombre
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/permisos/{id}:
 *   put:
 *     summary: Actualiza el nombre de un permiso
 *     tags: [Permisos]
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
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "ELIMINAR_RESERVA"
 *     responses:
 *       200:
 *         description: Permiso actualizado
 *       404:
 *         description: Permiso no encontrado
 *       409:
 *         description: El nombre ya está en uso por otro permiso
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/permisos/{id}:
 *   delete:
 *     summary: Elimina un permiso del sistema
 *     tags: [Permisos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Permiso eliminado correctamente
 *       404:
 *         description: Permiso no encontrado
 */
router.delete('/:id', ctrl.remove);

module.exports = router;