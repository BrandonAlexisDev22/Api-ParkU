/**
 * @swagger
 * tags:
 *   name: Reservas
 *   description: Endpoints para gestionar reservas de celdas y vehículos
 */

const svc = require('../services/reserva.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     Reserva:
 *       type: object
 *       required:
 *         - celda
 *         - vehiculo
 *         - fechaHora_inicio
 *         - fechaHora_fin
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la reserva.
 *         celda:
 *           type: integer
 *           description: ID de la celda a reservar.
 *         vehiculo:
 *           type: integer
 *           description: ID del vehículo que reserva.
 *         fechaHora_inicio:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de inicio de la reserva.
 *         fechaHora_fin:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de finalización de la reserva.
 *         estado:
 *           type: integer
 *           enum: [0, 1]
 *           description: Estado (1=activa, 0=finalizada/cancelada).
 *     ReservaCreate:
 *       type: object
 *       required:
 *         - celda
 *         - vehiculo
 *         - fechaHora_inicio
 *         - fechaHora_fin
 *       properties:
 *         celda:
 *           type: integer
 *         vehiculo:
 *           type: integer
 *         fechaHora_inicio:
 *           type: string
 *           format: date-time
 *         fechaHora_fin:
 *           type: string
 *           format: date-time
 *         estado:
 *           type: integer
 *           default: 1
 *     ReservaUpdate:
 *       type: object
 *       properties:
 *         celda:
 *           type: integer
 *         vehiculo:
 *           type: integer
 *         fechaHora_inicio:
 *           type: string
 *           format: date-time
 *         fechaHora_fin:
 *           type: string
 *           format: date-time
 *         estado:
 *           type: integer
 *           enum: [0, 1]
 */

/**
 * @swagger
 * /reservas:
 *   get:
 *     summary: Obtener todas las reservas
 *     tags: [Reservas]
 *     responses:
 *       200:
 *         description: Lista de todas las reservas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reserva'
 */
const getAll = async (req, res) => {
  try {
    const data = await svc.getAll();
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /reservas/{id}:
 *   get:
 *     summary: Obtener una reserva por ID
 *     tags: [Reservas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reserva
 *     responses:
 *       200:
 *         description: Reserva encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reserva'
 *       404:
 *         description: Reserva no encontrada
 */
const getById = async (req, res) => {
  try {
    const data = await svc.getById(req.params.id);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /reservas/vehiculo/{vehiculoId}:
 *   get:
 *     summary: Obtener reservas por vehículo
 *     tags: [Reservas]
 *     parameters:
 *       - in: path
 *         name: vehiculoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     responses:
 *       200:
 *         description: Lista de reservas del vehículo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reserva'
 */
const getByVehiculo = async (req, res) => {
  try {
    const data = await svc.getByVehiculo(req.params.vehiculoId);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /reservas/celda/{celdaId}:
 *   get:
 *     summary: Obtener reservas por celda
 *     tags: [Reservas]
 *     parameters:
 *       - in: path
 *         name: celdaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la celda
 *     responses:
 *       200:
 *         description: Lista de reservas de la celda
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reserva'
 */
const getByCelda = async (req, res) => {
  try {
    const data = await svc.getByCelda(req.params.celdaId);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /reservas:
 *   post:
 *     summary: Crear una nueva reserva
 *     tags: [Reservas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReservaCreate'
 *     responses:
 *       201:
 *         description: Reserva creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reserva'
 *       400:
 *         description: Datos inválidos o fechas incorrectas
 *       404:
 *         description: Celda o vehículo no encontrado
 *       409:
 *         description: Conflicto de horario - la celda ya está reservada
 */
const create = async (req, res) => {
  try {
    const newReserva = await svc.create(req.body);
    res.status(201).json(newReserva);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /reservas/{id}:
 *   put:
 *     summary: Actualizar una reserva (parcial o total)
 *     tags: [Reservas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReservaUpdate'
 *     responses:
 *       200:
 *         description: Reserva actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reserva'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Reserva no encontrada
 *       409:
 *         description: Conflicto de horario con otra reserva
 */
const update = async (req, res) => {
  try {
    const updated = await svc.update(req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /reservas/{id}:
 *   delete:
 *     summary: Eliminar una reserva por ID
 *     tags: [Reservas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reserva
 *     responses:
 *       204:
 *         description: Reserva eliminada correctamente
 *       404:
 *         description: Reserva no encontrada
 *       409:
 *         description: No se puede eliminar porque está referenciada
 */
const remove = async (req, res) => {
  try {
    await svc.remove(req.params.id);
    res.status(204).send();
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = {
  getAll,
  getById,
  getByVehiculo,
  getByCelda,
  create,
  update,
  remove,
};