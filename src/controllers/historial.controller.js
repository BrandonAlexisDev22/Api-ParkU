const svc = require('../services/historial.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     HistorialCelda:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         celda_id:
 *           type: integer
 *         usuario_id:
 *           type: integer
 *         accion:
 *           type: string
 *         estado_anterior:
 *           type: string
 *           nullable: true
 *         estado_nuevo:
 *           type: string
 *           nullable: true
 *         motivo:
 *           type: string
 *           nullable: true
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *     HistorialParqueadero:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         parqueadero_id:
 *           type: integer
 *         usuario_id:
 *           type: integer
 *         accion:
 *           type: string
 *         estado_anterior:
 *           type: boolean
 *           nullable: true
 *         estado_nuevo:
 *           type: boolean
 *           nullable: true
 *         motivo:
 *           type: string
 *           nullable: true
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *     HistorialReserva:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         reserva_id:
 *           type: integer
 *         usuario_id:
 *           type: integer
 *         accion:
 *           type: string
 *         estado_anterior:
 *           type: string
 *           nullable: true
 *         estado_nuevo:
 *           type: string
 *           nullable: true
 *         motivo:
 *           type: string
 *           nullable: true
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *     HistorialNovedad:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         novedad_id:
 *           type: integer
 *         usuario_id:
 *           type: integer
 *         accion:
 *           type: string
 *         estado_anterior:
 *           type: string
 *           nullable: true
 *         estado_nuevo:
 *           type: string
 *           nullable: true
 *         prioridad_anterior:
 *           type: string
 *           nullable: true
 *         prioridad_nueva:
 *           type: string
 *           nullable: true
 *         comentario:
 *           type: string
 *           nullable: true
 *         fecha_hora:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /celdas/{id}/historial:
 *   get:
 *     summary: Historial de cambios de una celda
 *     tags: [Celdas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Historial de la celda
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HistorialCelda'
 */
const getByCelda = async (req, res) => {
  try {
    res.json(await svc.getByCelda(req.params.id));
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /parqueaderos/{id}/historial:
 *   get:
 *     summary: Historial de cambios de un parqueadero
 *     tags: [Parqueaderos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Historial del parqueadero
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HistorialParqueadero'
 */
const getByParqueadero = async (req, res) => {
  try {
    res.json(await svc.getByParqueadero(req.params.id));
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /reservas/{id}/historial:
 *   get:
 *     summary: Historial de cambios de una reserva
 *     tags: [Reservas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Historial de la reserva
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HistorialReserva'
 */
const getByReserva = async (req, res) => {
  try {
    res.json(await svc.getByReserva(req.params.id));
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /novedades/{id}/historial:
 *   get:
 *     summary: Historial de cambios de una novedad
 *     tags: [Novedades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Historial de la novedad
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HistorialNovedad'
 */
const getByNovedad = async (req, res) => {
  try {
    res.json(await svc.getByNovedad(req.params.id));
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = { getByCelda, getByParqueadero, getByReserva, getByNovedad };
