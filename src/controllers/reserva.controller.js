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
  try { res.json(await svc.getAll()); } 
  catch(e) { handleError(res,e); } 
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
  try { res.json(await svc.getById(req.params.id)); } 
  catch(e) { handleError(res,e); } 
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
  try { res.json(await svc.getByVehiculo(req.params.vehiculoId)); } 
  catch(e) { handleError(res,e); } 
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
  try { res.json(await svc.getByCelda(req.params.celdaId)); } 
  catch(e) { handleError(res,e); } 
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
 *             $ref: '#/components/schemas/Reserva'
 *     responses:
 *       201:
 *         description: Reserva creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reserva'
 */
const create = async (req, res) => { 
  try { res.status(201).json(await svc.create(req.body)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /reservas/{id}:
 *   put:
 *     summary: Actualizar una reserva por ID
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
 *             $ref: '#/components/schemas/Reserva'
 *     responses:
 *       200:
 *         description: Reserva actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reserva'
 */
const update = async (req, res) => { 
  try { res.json(await svc.update(req.params.id, req.body)); } 
  catch(e) { handleError(res,e); } 
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
 */
const remove = async (req, res) => { 
  try { await svc.remove(req.params.id); res.status(204).send(); } 
  catch(e) { handleError(res,e); } 
};

module.exports = { getAll, getById, getByVehiculo, getByCelda, create, update, remove };

/**
 * @swagger
 * components:
 *   schemas:
 *     Reserva:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID de la reserva
 *         id_vehiculo:
 *           type: integer
 *           description: ID del vehículo reservado
 *         id_conductor:
 *           type: integer
 *           description: ID del conductor
 *         id_celda:
 *           type: integer
 *           description: ID de la celda reservada
 *         fecha_reserva:
 *           type: string
 *           format: date
 *           description: Fecha de la reserva
 *         hora_reserva:
 *           type: string
 *           format: time
 *           description: Hora de la reserva
 *         fecha_ingreso:
 *           type: string
 *           format: date
 *           description: Fecha de ingreso al parqueadero
 *         hora_ingreso:
 *           type: string
 *           format: time
 *           description: Hora de ingreso
 *         estado_reserva:
 *           type: string
 *           description: Estado actual de la reserva
 *       required:
 *         - id_vehiculo
 *         - id_conductor
 *         - id_celda
 *         - fecha_reserva
 *         - hora_reserva
 *         - estado_reserva
 */