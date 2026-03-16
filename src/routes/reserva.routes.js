const router = require('express').Router();
const ctrl   = require('../controllers/reserva.controller');

/**
 * @swagger
 * tags:
 *   name: Reservas
 *   description: Gestión de agenda y apartados de celdas por tiempo
 */

/**
 * @swagger
 * /api/reservas:
 *   get:
 *     summary: Obtiene todas las reservas
 *     tags: [Reservas]
 *     responses:
 *       200:
 *         description: Listado de reservas obtenido con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reserva'
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/reservas/vehiculo/{vehiculoId}:
 *   get:
 *     summary: Obtiene las reservas de un vehículo específico
 *     tags: [Reservas]
 *     parameters:
 *       - in: path
 *         name: vehiculoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo para consultar sus reservas
 *     responses:
 *       200:
 *         description: Reservas asociadas al vehículo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reserva'
 */
router.get('/vehiculo/:vehiculoId', ctrl.getByVehiculo);

/**
 * @swagger
 * /api/reservas/celda/{celdaId}:
 *   get:
 *     summary: Obtiene las reservas de una celda específica
 *     tags: [Reservas]
 *     parameters:
 *       - in: path
 *         name: celdaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la celda para consultar su historial de reservas
 *     responses:
 *       200:
 *         description: Historial de reservas de la celda
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reserva'
 */
router.get('/celda/:celdaId', ctrl.getByCelda);

/**
 * @swagger
 * /api/reservas/{id}:
 *   get:
 *     summary: Obtiene una reserva por su ID
 *     tags: [Reservas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle de la reserva
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reserva'
 *       404:
 *         description: Reserva no encontrada
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/reservas:
 *   post:
 *     summary: Crea una nueva reserva
 *     description: Valida que no existan solapamientos horarios en la celda elegida.
 *     tags: [Reservas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - celda
 *               - vehiculo
 *               - fechaHora_inicio
 *               - fechaHora_fin
 *             properties:
 *               celda:
 *                 type: integer
 *               vehiculo:
 *                 type: integer
 *               fechaHora_inicio:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-20T10:00:00Z"
 *               fechaHora_fin:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-20T12:00:00Z"
 *     responses:
 *       201:
 *         description: Reserva creada con éxito
 *       400:
 *         description: Fechas inválidas o en el pasado
 *       409:
 *         description: Conflicto - La celda ya está reservada en ese horario
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/reservas/{id}:
 *   put:
 *     summary: Actualiza una reserva
 *     tags: [Reservas]
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
 *             $ref: '#/components/schemas/Reserva'
 *     responses:
 *       200:
 *         description: Reserva modificada
 *       409:
 *         description: El nuevo horario choca con otra reserva existente
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/reservas/{id}:
 *   delete:
 *     summary: Cancela o elimina una reserva
 *     tags: [Reservas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Reserva eliminada correctamente
 */
router.delete('/:id', ctrl.remove);

module.exports = router;