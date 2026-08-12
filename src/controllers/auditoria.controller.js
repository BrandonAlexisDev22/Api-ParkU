/**
 * @swagger
 * tags:
 *   name: Auditoria
 *   description: Rastro de auditoría de la BD (solo lectura, solo administradores)
 */

const svc = require('../services/auditoria.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     Auditoria:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         tabla_afectada:
 *           type: string
 *         registro_id:
 *           type: integer
 *         accion:
 *           type: string
 *           enum: [CREAR, EDITAR, CAMBIAR_ESTADO, ELIMINAR, CONSULTAR]
 *         usuario_id:
 *           type: integer
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *         motivo:
 *           type: string
 *           nullable: true
 *         valor_anterior:
 *           type: object
 *           nullable: true
 *         valor_nuevo:
 *           type: object
 *           nullable: true
 */

/**
 * @swagger
 * /auditoria:
 *   get:
 *     summary: Consultar el rastro de auditoría
 *     tags: [Auditoria]
 *     parameters:
 *       - in: query
 *         name: tabla_afectada
 *         schema:
 *           type: string
 *       - in: query
 *         name: registro_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: usuario_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Registros de auditoría
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Auditoria'
 */
const getAll = async (req, res) => {
  try {
    res.json(await svc.getAll(req.query));
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /auditoria/{id}:
 *   get:
 *     summary: Obtener un registro de auditoría por ID
 *     tags: [Auditoria]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Registro encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Auditoria'
 *       404:
 *         description: No encontrado
 */
const getById = async (req, res) => {
  try {
    res.json(await svc.getById(req.params.id));
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = { getAll, getById };
