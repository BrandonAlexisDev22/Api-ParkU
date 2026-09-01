/**
 * @swagger
 * tags:
 *   name: Monitoreo
 *   description: Vista en vivo del parqueadero (celdas, ocupación, vehículos fuera de horario)
 */

const svc = require('../services/monitoreo.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * /monitoreo/celdas:
 *   get:
 *     summary: Estado en vivo de las celdas (disponible/ocupada/etc., y quién la ocupa)
 *     tags: [Monitoreo]
 *     parameters:
 *       - in: query
 *         name: parqueaderoId
 *         schema:
 *           type: integer
 *         description: Filtra por parqueadero (opcional)
 *     responses:
 *       200:
 *         description: Listado de celdas con su ocupación actual
 */
const getCeldas = async (req, res) => {
  try {
    const parqueaderoId = req.query.parqueaderoId ? Number(req.query.parqueaderoId) : undefined;
    res.json(await svc.getCeldas(parqueaderoId));
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /monitoreo/fuera-horario:
 *   get:
 *     summary: Vehículos actualmente estacionados que ya superaron el horario de cierre
 *     tags: [Monitoreo]
 *     parameters:
 *       - in: query
 *         name: parqueaderoId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Listado de ingresos activos fuera de horario
 */
const getFueraDeHorario = async (req, res) => {
  try {
    const parqueaderoId = req.query.parqueaderoId ? Number(req.query.parqueaderoId) : undefined;
    res.json(await svc.getFueraDeHorario(parqueaderoId));
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /monitoreo/incidentes/fuera-horario:
 *   post:
 *     summary: Genera una novedad para cada vehículo fuera de horario que aún no tenga una abierta
 *     description: Idempotente -- si ya existe una novedad no cerrada para ese ingreso, no crea otra.
 *     tags: [Monitoreo]
 *     parameters:
 *       - in: query
 *         name: parqueaderoId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "{ creadas: Novedad[], yaExistian: Array }"
 */
const detectarIncidentesFueraDeHorario = async (req, res) => {
  try {
    const parqueaderoId = req.query.parqueaderoId ? Number(req.query.parqueaderoId) : undefined;
    const resultado = await svc.detectarIncidentesFueraDeHorario(req.usuario?.id, parqueaderoId);
    res.json(resultado);
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = { getCeldas, getFueraDeHorario, detectarIncidentesFueraDeHorario };
