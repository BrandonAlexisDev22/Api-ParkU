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
 * /entradas-salidas:
 *   get:
 *     summary: Obtener todas las entradas y salidas
 *     tags: [EntradasSalidas]
 *     responses:
 *       200:
 *         description: Lista de todas las entradas y salidas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EntradaSalida'
 */
const getAll = async (req, res) => { 
  try { res.json(await svc.getAll()); } 
  catch(e) { handleError(res,e); } 
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
  try { res.json(await svc.getById(req.params.id)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /entradas-salidas/vehiculo/{vehiculoId}:
 *   get:
 *     summary: Obtener registros por vehículo
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
  try { res.json(await svc.getByVehiculo(req.params.vehiculoId)); } 
  catch(e) { handleError(res,e); } 
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
 *         description: Lista de registros en el rango de fechas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EntradaSalida'
 */
const getByFecha = async (req, res) => { 
  try { res.json(await svc.getByFecha(req.query.desde, req.query.hasta)); } 
  catch(e) { handleError(res,e); } 
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
 *             $ref: '#/components/schemas/EntradaSalida'
 *     responses:
 *       201:
 *         description: Entrada registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EntradaSalida'
 */
const registrarEntrada = async (req, res) => { 
  try { res.status(201).json(await svc.registrarEntrada(req.body)); } 
  catch(e) { handleError(res,e); } 
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
 *             $ref: '#/components/schemas/EntradaSalida'
 *     responses:
 *       201:
 *         description: Salida registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EntradaSalida'
 */
const registrarSalida = async (req, res) => { 
  try { res.status(201).json(await svc.registrarSalida(req.body)); } 
  catch(e) { handleError(res,e); } 
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
 */
const remove = async (req, res) => { 
  try { await svc.remove(req.params.id); res.status(204).send(); } 
  catch(e) { handleError(res,e); } 
};

module.exports = { getAll, getById, getByVehiculo, getByFecha, registrarEntrada, registrarSalida, remove };

/**
 * @swagger
 * components:
 *   schemas:
 *     EntradaSalida:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del registro
 *         id_vehiculo:
 *           type: integer
 *           description: ID del vehículo
 *         id_conductor:
 *           type: integer
 *           description: ID del conductor
 *         tipo:
 *           type: string
 *           description: Tipo de registro (entrada o salida)
 *         fecha:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del registro
 *       required:
 *         - id_vehiculo
 *         - id_conductor
 *         - tipo
 *         - fecha
 */