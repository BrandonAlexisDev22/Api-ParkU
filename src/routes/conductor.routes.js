const router = require('express').Router();
const ctrl   = require('../controllers/conductor.controller');

/**
 * @swagger
 * tags:
 *   name: Conductores
 *   description: Gestión de perfiles de conductores y su información asociada
 */

/**
 * @swagger
 * /api/conductores:
 *   get:
 *     summary: Obtiene todos los conductores
 *     tags: [Conductores]
 *     responses:
 *       200:
 *         description: Lista de conductores obtenida con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conductor'
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/conductores/{id}:
 *   get:
 *     summary: Obtiene un conductor por su ID
 *     tags: [Conductores]
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
 *       404:
 *         description: Conductor no encontrado
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/conductores:
 *   post:
 *     summary: Registra un nuevo conductor
 *     tags: [Conductores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuario
 *             properties:
 *               usuario:
 *                 type: integer
 *                 description: ID del usuario al que se le asigna el perfil
 *               perfil:
 *                 type: string
 *                 description: Información del perfil (ej. Estudiante)
 *               discapacidad:
 *                 type: boolean
 *                 description: Indica si requiere celdas especiales
 *     responses:
 *       201:
 *         description: Conductor creado exitosamente
 *       400:
 *         description: Falta el campo usuario
 *       404:
 *         description: El usuario no existe
 *       409:
 *         description: El usuario ya tiene un perfil de conductor activo
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/conductores/{id}:
 *   put:
 *     summary: Actualiza la información de un conductor
 *     tags: [Conductores]
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
 *             $ref: '#/components/schemas/Conductor'
 *     responses:
 *       200:
 *         description: Conductor actualizado
 *       404:
 *         description: Registro no encontrado
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/conductores/{id}:
 *   delete:
 *     summary: Elimina un registro de conductor
 *     tags: [Conductores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor a eliminar
 *     responses:
 *       200:
 *         description: Registro eliminado correctamente
 *       404:
 *         description: Conductor no encontrado
 */
router.delete('/:id', ctrl.remove);

module.exports = router;