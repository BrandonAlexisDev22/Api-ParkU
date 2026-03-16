/**
 * @swagger
 * tags:
 *   name: Conductores
 *   description: Endpoints para gestionar conductores
 */

const svc = require('../services/conductor.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * /conductores:
 *   get:
 *     summary: Obtener todos los conductores
 *     tags: [Conductores]
 *     responses:
 *       200:
 *         description: Lista de todos los conductores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conductor'
 */
const getAll = async (req, res) => { 
  try { res.json(await svc.getAll()); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /conductores/{id}:
 *   get:
 *     summary: Obtener un conductor por ID
 *     tags: [Conductores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor
 *     responses:
 *       200:
 *         description: Conductor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conductor'
 *       404:
 *         description: Conductor no encontrado
 */
const getById = async (req, res) => { 
  try { res.json(await svc.getById(req.params.id)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /conductores:
 *   post:
 *     summary: Crear un nuevo conductor
 *     tags: [Conductores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Conductor'
 *     responses:
 *       201:
 *         description: Conductor creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conductor'
 */
const create = async (req, res) => { 
  try { res.status(201).json(await svc.create(req.body)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /conductores/{id}:
 *   put:
 *     summary: Actualizar un conductor por ID
 *     tags: [Conductores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Conductor'
 *     responses:
 *       200:
 *         description: Conductor actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conductor'
 */
const update = async (req, res) => { 
  try { res.json(await svc.update(req.params.id, req.body)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /conductores/{id}:
 *   delete:
 *     summary: Eliminar un conductor por ID
 *     tags: [Conductores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor
 *     responses:
 *       204:
 *         description: Conductor eliminado correctamente
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
 *     Conductor:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del conductor
 *         nombre:
 *           type: string
 *           description: Nombre completo del conductor
 *         licencia:
 *           type: string
 *           description: Número de licencia del conductor
 *         telefono:
 *           type: string
 *           description: Número de teléfono del conductor
 *       required:
 *         - nombre
 *         - licencia
 */