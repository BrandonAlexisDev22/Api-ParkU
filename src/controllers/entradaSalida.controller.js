/**
 * @swagger
 * tags:
 *   name: EntradasSalidas
 *   description: Endpoints para gestionar entradas y salidas de vehículos
 */

const svc = require('../services/entradaSalida.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     EntradaSalida:
 *       type: object
 *       required:
 *         - tipo
 *         - vehiculo
 *         - celda
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental del registro.
 *         tipo:
 *           type: string
 *           enum: [INGRESO, SALIDA]
 *           description: Tipo de movimiento.
 *         vehiculo:
 *           type: integer
 *           description: ID del vehículo.
 *         celda:
 *           type: integer
 *           description: ID de la celda utilizada.
 *         descripcion:
 *           type: string
 *           nullable: true
 *           description: Observaciones opcionales.
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del movimiento (se asigna automáticamente si no se envía).
 *     EntradaSalidaCreate:
 *       type: object
 *       required:
 *         - vehiculo
 *         - celda
 *       properties:
 *         vehiculo:
 *           type: integer
 *         celda:
 *           type: integer
 *         descripcion:
 *           type: string
 *           nullable: true
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *           description: Opcional, si no se envía se usa la actual.
 */

/**
 * @swagger
 * /entradas-salidas:
 *   get:
 *     summary: Obtener todas las entradas y salidas
 *     tags: [EntradasSalidas]
 *     responses:
 *       200:
 *         description: Lista de todos los registros
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EntradaSalida'
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
 * /entradas-salidas/{id}:
 *   get:
 *     summary: Obtener un registro por ID
 *     tags: [EntradasSalidas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro
 *     responses:
 *       200:
 *         description: Registro encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EntradaSalida'
 *       404:
 *         description: Registro no encontrado
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
 * /entradas-salidas/vehiculo/{vehiculoId}:
 *   get:
 *     summary: Obtener todos los registros de un vehículo
 *     tags: [EntradasSalidas]
 *     parameters:
 *       - in: path
 *         name: vehiculoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     responses:
 *       200:
 *         description: Lista de registros del vehículo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EntradaSalida'
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
 * /entradas-salidas/fecha:
 *   get:
 *     summary: Obtener registros por rango de fechas
 *     tags: [EntradasSalidas]
 *     parameters:
 *       - in: query
 *         name: desde
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD)
 *       - in: query
 *         name: hasta
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de registros en el rango
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EntradaSalida'
 *       400:
 *         description: Fechas inválidas o faltantes
 */
const getByFecha = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ message: 'Los parámetros "desde" y "hasta" son requeridos' });
    }
    const data = await svc.getByFecha(desde, hasta);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /entradas-salidas/entrada:
 *   post:
 *     summary: Registrar la entrada de un vehículo
 *     tags: [EntradasSalidas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EntradaSalidaCreate'
 *     responses:
 *       201:
 *         description: Entrada registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EntradaSalida'
 *       400:
 *         description: Datos inválidos o faltantes
 *       404:
 *         description: Vehículo o celda no encontrados
 *       409:
 *         description: Conflicto (ej. celda ya ocupada)
 */
const registrarEntrada = async (req, res) => {
  try {
    const data = await svc.registrarEntrada(req.body);
    res.status(201).json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /entradas-salidas/salida:
 *   post:
 *     summary: Registrar la salida de un vehículo
 *     tags: [EntradasSalidas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EntradaSalidaCreate'
 *     responses:
 *       201:
 *         description: Salida registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EntradaSalida'
 *       400:
 *         description: Datos inválidos o faltantes
 *       404:
 *         description: Vehículo o celda no encontrados
 *       409:
 *         description: Conflicto (ej. no hay entrada activa para ese vehículo)
 */
const registrarSalida = async (req, res) => {
  try {
    const data = await svc.registrarSalida(req.body);
    res.status(201).json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /entradas-salidas/{id}:
 *   delete:
 *     summary: Eliminar un registro por ID
 *     tags: [EntradasSalidas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro
 *     responses:
 *       204:
 *         description: Registro eliminado correctamente
 *       404:
 *         description: Registro no encontrado
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
  getByFecha,
  registrarEntrada,
  registrarSalida,
  remove,
};