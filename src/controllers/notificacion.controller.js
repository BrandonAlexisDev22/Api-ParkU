/**
 * @swagger
 * tags:
 *   name: Notificaciones
 *   description: Notificaciones del usuario autenticado (se generan solas desde la BD)
 */

const svc = require('../services/notificacion.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notificacion:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         usuario_id:
 *           type: integer
 *           description: Destinatario.
 *         titulo:
 *           type: string
 *         mensaje:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [NOVEDAD, RESERVA, CAMBIO_ESTADO, ALERTA, ACCESO]
 *         referencia_tabla:
 *           type: string
 *           nullable: true
 *         referencia_id:
 *           type: integer
 *           nullable: true
 *         leida:
 *           type: boolean
 *         fecha_hora:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /notificaciones:
 *   get:
 *     summary: Obtener las notificaciones del usuario autenticado
 *     tags: [Notificaciones]
 *     parameters:
 *       - in: query
 *         name: soloNoLeidas
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notificacion'
 */
const getMisNotificaciones = async (req, res) => {
  try {
    const soloNoLeidas = req.query.soloNoLeidas === 'true';
    const data = await svc.getMisNotificaciones(req.usuario?.id, soloNoLeidas);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /notificaciones/{id}/leida:
 *   patch:
 *     summary: Marcar una notificación como leída
 *     tags: [Notificaciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notificación actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notificacion'
 *       404:
 *         description: Notificación no encontrada
 */
const marcarLeida = async (req, res) => {
  try {
    const data = await svc.marcarLeida(req.params.id, req.usuario?.id);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /notificaciones/leer-todas:
 *   patch:
 *     summary: Marcar todas las notificaciones del usuario autenticado como leídas
 *     tags: [Notificaciones]
 *     responses:
 *       200:
 *         description: Cantidad de notificaciones actualizadas
 */
const marcarTodasLeidas = async (req, res) => {
  try {
    const actualizadas = await svc.marcarTodasLeidas(req.usuario?.id);
    res.json({ actualizadas });
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = { getMisNotificaciones, marcarLeida, marcarTodasLeidas };
