/**
 * @swagger
 * tags:
 *   name: Celdas
 *   description: Endpoints para gestionar las celdas de parqueadero
 */

const svc = require('../services/celda.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * /celdas:
 *   get:
 *     summary: Obtener todas las celdas
 *     tags: [Celdas]
 *     responses:
 *       200:
 *         description: Lista de todas las celdas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Celda'
 */
const getAll = async (req, res) => { 
  try { res.json(await svc.getAll()); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /celdas/{id}:
 *   get:
 *     summary: Obtener una celda por ID
 *     tags: [Celdas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la celda
 *     responses:
 *       200:
 *         description: Celda encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Celda'
 *       404:
 *         description: Celda no encontrada
 */
const getById = async (req, res) => { 
  try { res.json(await svc.getById(req.params.id)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /celdas/parqueadero/{parqueaderoId}:
 *   get:
 *     summary: Obtener celdas de un parqueadero
 *     tags: [Celdas]
 *     parameters:
 *       - in: path
 *         name: parqueaderoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del parqueadero
 *     responses:
 *       200:
 *         description: Lista de celdas del parqueadero
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Celda'
 */
const getByParqueadero = async (req, res) => { 
  try { res.json(await svc.getByParqueadero(req.params.parqueaderoId)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /celdas/disponibles/{parqueaderoId}:
 *   get:
 *     summary: Obtener celdas disponibles de un parqueadero
 *     tags: [Celdas]
 *     parameters:
 *       - in: path
 *         name: parqueaderoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del parqueadero
 *     responses:
 *       200:
 *         description: Lista de celdas disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Celda'
 */
const getDisponibles = async (req, res) => { 
  try { res.json(await svc.getDisponibles(req.params.parqueaderoId)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /celdas:
 *   post:
 *     summary: Crear una nueva celda
 *     tags: [Celdas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Celda'
 *     responses:
 *       201:
 *         description: Celda creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Celda'
 */
const create = async (req, res) => { 
  try { res.status(201).json(await svc.create(req.body)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /celdas/{id}:
 *   put:
 *     summary: Actualizar una celda por ID
 *     tags: [Celdas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la celda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Celda'
 *     responses:
 *       200:
 *         description: Celda actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Celda'
 */
const update = async (req, res) => { 
  try { res.json(await svc.update(req.params.id, req.body)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /celdas/{id}:
 *   delete:
 *     summary: Eliminar una celda por ID
 *     tags: [Celdas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la celda
 *     responses:
 *       204:
 *         description: Celda eliminada correctamente
 */
const remove = async (req, res) => { 
  try { await svc.remove(req.params.id); res.status(204).send(); } 
  catch(e) { handleError(res,e); } 
};

module.exports = { getAll, getById, getByParqueadero, getDisponibles, create, update, remove };

/**
 * @swagger
 * components:
 *   schemas:
 *     Celda:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID de la celda
 *         nombre:
 *           type: string
 *           description: Nombre o identificador de la celda
 *         estado:
 *           type: string
 *           description: Estado de la celda (ocupada, disponible, fuera de servicio)
 *         id_parqueadero:
 *           type: integer
 *           description: ID del parqueadero al que pertenece la celda
 *       required:
 *         - nombre
 *         - estado
 *         - id_parqueadero
 */