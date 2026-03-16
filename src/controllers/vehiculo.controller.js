/**
 * @swagger
 * tags:
 *   name: Vehículos
 *   description: Endpoints para gestionar vehículos
 */

const svc = require('../services/vehiculo.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * /vehiculos:
 *   get:
 *     summary: Obtener todos los vehículos
 *     tags: [Vehículos]
 *     responses:
 *       200:
 *         description: Lista de todos los vehículos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehiculo'
 */
const getAll = async (req, res) => { 
  try { res.json(await svc.getAll()); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /vehiculos/{id}:
 *   get:
 *     summary: Obtener un vehículo por ID
 *     tags: [Vehículos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     responses:
 *       200:
 *         description: Vehículo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehiculo'
 *       404:
 *         description: Vehículo no encontrado
 */
const getById = async (req, res) => { 
  try { res.json(await svc.getById(req.params.id)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /vehiculos/conductor/{conductorId}:
 *   get:
 *     summary: Obtener vehículos por conductor
 *     tags: [Vehículos]
 *     parameters:
 *       - in: path
 *         name: conductorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor
 *     responses:
 *       200:
 *         description: Lista de vehículos del conductor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehiculo'
 */
const getByConductor = async (req, res) => { 
  try { res.json(await svc.getByConductor(req.params.conductorId)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /vehiculos:
 *   post:
 *     summary: Crear un nuevo vehículo
 *     tags: [Vehículos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Vehiculo'
 *     responses:
 *       201:
 *         description: Vehículo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehiculo'
 */
const create = async (req, res) => { 
  try { res.status(201).json(await svc.create(req.body)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /vehiculos/{id}:
 *   put:
 *     summary: Actualizar un vehículo por ID
 *     tags: [Vehículos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Vehiculo'
 *     responses:
 *       200:
 *         description: Vehículo actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehiculo'
 */
const update = async (req, res) => { 
  try { res.json(await svc.update(req.params.id, req.body)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /vehiculos/{id}:
 *   delete:
 *     summary: Eliminar un vehículo por ID
 *     tags: [Vehículos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     responses:
 *       204:
 *         description: Vehículo eliminado correctamente
 */
const remove = async (req, res) => { 
  try { await svc.remove(req.params.id); res.status(204).send(); } 
  catch(e) { handleError(res,e); } 
};

module.exports = { getAll, getById, getByConductor, create, update, remove };

/**
 * @swagger
 * components:
 *   schemas:
 *     Vehiculo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del vehículo
 *         placa:
 *           type: string
 *           description: Placa del vehículo
 *         modelo:
 *           type: string
 *           description: Modelo del vehículo
 *         color:
 *           type: string
 *           description: Color del vehículo
 *         id_conductor:
 *           type: integer
 *           description: ID del conductor asignado
 *       required:
 *         - placa
 *         - modelo
 *         - color
 *         - id_conductor
 */