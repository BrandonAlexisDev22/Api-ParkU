/**
 * @swagger
 * tags:
 *   name: Parqueaderos
 *   description: Endpoints para gestionar los parqueaderos
 */

const svc = require('../services/parqueadero.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * /parqueaderos:
 *   get:
 *     summary: Obtener todos los parqueaderos
 *     tags: [Parqueaderos]
 *     responses:
 *       200:
 *         description: Lista de todos los parqueaderos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Parqueadero'
 */
const getAll = async (req, res) => { 
  try { res.json(await svc.getAll()); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /parqueaderos/{id}:
 *   get:
 *     summary: Obtener un parqueadero por ID
 *     tags: [Parqueaderos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del parqueadero
 *     responses:
 *       200:
 *         description: Parqueadero encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parqueadero'
 *       404:
 *         description: Parqueadero no encontrado
 */
const getById = async (req, res) => { 
  try { res.json(await svc.getById(req.params.id)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /parqueaderos:
 *   post:
 *     summary: Crear un nuevo parqueadero
 *     tags: [Parqueaderos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Parqueadero'
 *     responses:
 *       201:
 *         description: Parqueadero creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parqueadero'
 */
const create = async (req, res) => { 
  try { res.status(201).json(await svc.create(req.body)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /parqueaderos/{id}:
 *   put:
 *     summary: Actualizar un parqueadero por ID
 *     tags: [Parqueaderos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del parqueadero
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Parqueadero'
 *     responses:
 *       200:
 *         description: Parqueadero actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parqueadero'
 */
const update = async (req, res) => { 
  try { res.json(await svc.update(req.params.id, req.body)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /parqueaderos/{id}:
 *   delete:
 *     summary: Eliminar un parqueadero por ID
 *     tags: [Parqueaderos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del parqueadero
 *     responses:
 *       204:
 *         description: Parqueadero eliminado correctamente
 */
const remove = async (req, res) => { 
  try { await svc.remove(req.params.id); res.status(204).send(); } 
  catch(e) { handleError(res,e); } 
};

module.exports = { getAll, getById, create, update, remove };

/**
 * @swagger
 * components:
 *   schemas:
 *     Parqueadero:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del parqueadero
 *         nombre:
 *           type: string
 *           description: Nombre del parqueadero
 *         direccion:
 *           type: string
 *           description: Dirección del parqueadero
 *         capacidad:
 *           type: integer
 *           description: Número de celdas disponibles en el parqueadero
 *       required:
 *         - nombre
 *         - direccion
 *         - capacidad
 */