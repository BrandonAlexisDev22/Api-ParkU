const svc = require('../services/disponibilidadCelda.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     DisponibilidadCelda:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         celda_id:
 *           type: integer
 *         estado:
 *           type: string
 *           enum: [DISPONIBLE, OCUPADA, RESERVADA, MANTENIMIENTO, INACTIVA]
 *         motivo:
 *           type: string
 *           enum: [INGRESO_VEHICULO, SALIDA_VEHICULO, RESERVA, LIBERACION_RESERVA, MANTENIMIENTO, DANIO, ERROR_ASIGNACION, AJUSTE_OPERATIVO, OTRO]
 *         observacion:
 *           type: string
 *           nullable: true
 *         usuario_id:
 *           type: integer
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *     DisponibilidadCeldaCambiar:
 *       type: object
 *       required:
 *         - estado
 *         - motivo
 *       properties:
 *         estado:
 *           type: string
 *           enum: [DISPONIBLE, OCUPADA, RESERVADA, MANTENIMIENTO, INACTIVA]
 *         motivo:
 *           type: string
 *           enum: [INGRESO_VEHICULO, SALIDA_VEHICULO, RESERVA, LIBERACION_RESERVA, MANTENIMIENTO, DANIO, ERROR_ASIGNACION, AJUSTE_OPERATIVO, OTRO]
 *         observacion:
 *           type: string
 *           nullable: true
 */

/**
 * @swagger
 * /celdas/{id}/disponibilidad:
 *   get:
 *     summary: Obtiene el último cambio manual de disponibilidad de una celda
 *     tags: [Celdas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Disponibilidad vigente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DisponibilidadCelda'
 *       404:
 *         description: La celda no tiene cambios de disponibilidad registrados
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
 * /celdas/{id}/disponibilidad/historial:
 *   get:
 *     summary: Histórico de cambios manuales de disponibilidad de una celda
 *     tags: [Celdas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Histórico de disponibilidad
 */
const getHistorialPorCelda = async (req, res) => {
  try {
    res.json(await svc.getHistorialPorCelda(req.params.id));
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /celdas/{id}/disponibilidad:
 *   put:
 *     summary: Cambia manualmente el estado de una celda (mantenimiento, inactivar, reactivar)
 *     tags: [Celdas]
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
 *             $ref: '#/components/schemas/DisponibilidadCeldaCambiar'
 *     responses:
 *       200:
 *         description: Disponibilidad actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DisponibilidadCelda'
 *       400:
 *         description: Falta o es inválido el estado/motivo
 *       404:
 *         description: Celda no encontrada
 */
const cambiar = async (req, res) => {
  try {
    res.json(await svc.cambiar(req.params.id, req.body, req.usuario?.id));
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = { getByCelda, getHistorialPorCelda, cambiar };
