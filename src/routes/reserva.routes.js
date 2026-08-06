const router = require('express').Router();
const ctrl = require('../controllers/reserva.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Reservas
 *   description: Gestión de agenda y apartados de celdas por tiempo
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Reserva:
 *       type: object
 *       required:
 *         - celda
 *         - vehiculo_id
 *         - fecha_hora_inicio
 *         - fecha_hora_fin
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental de la reserva.
 *         celda:
 *           type: integer
 *           description: ID de la celda reservada.
 *         usuario_id:
 *           type: integer
 *           description: ID del usuario que realizó la reserva.
 *         vehiculo_id:
 *           type: integer
 *           description: ID del vehículo asociado a la reserva.
 *         fecha_hora_inicio:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de inicio.
 *         fecha_hora_fin:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de finalización.
 *         estado:
 *           type: boolean
 *           default: true
 *           description: true = Activa, false = Cancelada/Finalizada.
 *     ReservaCreate:
 *       type: object
 *       required:
 *         - celda
 *         - vehiculo_id
 *         - fecha_hora_inicio
 *         - fecha_hora_fin
 *       properties:
 *         celda:
 *           type: integer
 *         vehiculo_id:
 *           type: integer
 *         fecha_hora_inicio:
 *           type: string
 *           format: date-time
 *         fecha_hora_fin:
 *           type: string
 *           format: date-time
 *     ReservaUpdate:
 *       type: object
 *       properties:
 *         celda:
 *           type: integer
 *         vehiculo_id:
 *           type: integer
 *         fecha_hora_inicio:
 *           type: string
 *           format: date-time
 *         fecha_hora_fin:
 *           type: string
 *           format: date-time
 *         estado:
 *           type: boolean
 *           description: true = Activa, false = Cancelada/Finalizada.
 */

/**
 * @swagger
 * /api/reservas:
 *   get:
 *     summary: Obtiene todas las reservas
 *     tags: [Reservas]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Listado de reservas obtenido con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reserva'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 */
router.get('/',
  verificarToken,
  verificarRol([1, 2]), // Vigilante (1) o Admin (2)
  ctrl.getAll
);

/**
 * @swagger
 * /api/reservas/vehiculo/{vehiculoId}:
 *   get:
 *     summary: Obtiene las reservas de un vehículo específico
 *     tags: [Reservas]
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get('/vehiculo/:vehiculoId',
  verificarToken,
  ctrl.getByVehiculo
);

/**
 * @swagger
 * /api/reservas/celda/{celdaId}:
 *   get:
 *     summary: Obtiene las reservas de una celda específica
 *     tags: [Reservas]
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get('/celda/:celdaId',
  verificarToken,
  ctrl.getByCelda
);

/**
 * @swagger
 * /api/reservas/{id}:
 *   get:
 *     summary: Obtiene una reserva por su ID
 *     tags: [Reservas]
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
 *         description: Detalle de la reserva
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reserva'
 *       401:
 *         description: No autorizado - Token requerido
 *       404:
 *         description: Reserva no encontrada
 */
router.get('/:id',
  verificarToken,
  ctrl.getById
);

/**
 * @swagger
 * /api/reservas:
 *   post:
 *     summary: Crea una nueva reserva
 *     description: Valida que no existan solapamientos horarios en la celda elegida.
 *     tags: [Reservas]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReservaCreate'
 *     responses:
 *       201:
 *         description: Reserva creada con éxito
 *       400:
 *         description: Fechas inválidas o en el pasado
 *       401:
 *         description: No autorizado - Token requerido
 *       404:
 *         description: Celda o vehículo no encontrado
 *       409:
 *         description: Conflicto - La celda ya está reservada en ese horario
 */
router.post('/',
  verificarToken, // Cualquier usuario autenticado puede crear reservas
  ctrl.create
);

/**
 * @swagger
 * /api/reservas/{id}:
 *   put:
 *     summary: Actualiza una reserva
 *     tags: [Reservas]
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
 *             $ref: '#/components/schemas/ReservaUpdate'
 *     responses:
 *       200:
 *         description: Reserva modificada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reserva'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       404:
 *         description: Reserva no encontrada
 *       409:
 *         description: El nuevo horario choca con otra reserva existente
 */
router.put('/:id',
  verificarToken,
  verificarRol([1, 2]), // Vigilante (1) o Admin (2)
  ctrl.update
);

/**
 * @swagger
 * /api/reservas/{id}:
 *   delete:
 *     summary: Cancela o elimina una reserva
 *     tags: [Reservas]
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
 *         description: Reserva eliminada correctamente
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Reserva no encontrada
 *       409:
 *         description: No se puede eliminar porque está referenciada
 */
router.delete('/:id',
  verificarToken,
  verificarRol([2]), // Solo Admin (2)
  ctrl.remove
);

module.exports = router;