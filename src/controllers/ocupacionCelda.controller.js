/**
 * @swagger
 * tags:
 *   name: Ocupacion
 *   description: Quién ocupa (o ocupó) cada celda, ahora e histórico (solo lectura)
 */

const svc = require('../services/ocupacionCelda.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     OcupacionCelda:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         celda_id:
 *           type: integer
 *         vehiculo_id:
 *           type: integer
 *         registro_acceso_id:
 *           type: integer
 *           nullable: true
 *         reserva_id:
 *           type: integer
 *           nullable: true
 *         usuario_asigna_id:
 *           type: integer
 *         fecha_hora_inicio:
 *           type: string
 *           format: date-time
 *         fecha_hora_fin:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         estado:
 *           type: string
 *           enum: [ACTIVA, FINALIZADA, CANCELADA]
 */

/**
 * @swagger
 * /ocupaciones:
 *   get:
 *     summary: Obtener el historial completo de ocupación de celdas
 *     tags: [Ocupacion]
 *     responses:
 *       200:
 *         description: Lista de ocupaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OcupacionCelda'
 */
const getAll = async (req, res) => {
  try {
    res.json(await svc.getAll());
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /ocupaciones/{id}:
 *   get:
 *     summary: Obtener una ocupación por ID
 *     tags: [Ocupacion]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ocupación encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OcupacionCelda'
 *       404:
 *         description: Ocupación no encontrada
 */
const getById = async (req, res) => {
  try {
    res.json(await svc.getById(req.params.id));
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /ocupaciones/celda/{celdaId}:
 *   get:
 *     summary: Histórico de ocupación de una celda
 *     tags: [Ocupacion]
 *     parameters:
 *       - in: path
 *         name: celdaId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ocupaciones de la celda
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OcupacionCelda'
 */
const getByCelda = async (req, res) => {
  try {
    res.json(await svc.getByCelda(req.params.celdaId));
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /ocupaciones/vehiculo/{vehiculoId}:
 *   get:
 *     summary: Histórico de ocupación de un vehículo
 *     tags: [Ocupacion]
 *     parameters:
 *       - in: path
 *         name: vehiculoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ocupaciones del vehículo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OcupacionCelda'
 */
const getByVehiculo = async (req, res) => {
  try {
    res.json(await svc.getByVehiculo(req.params.vehiculoId));
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = { getAll, getById, getByCelda, getByVehiculo };
