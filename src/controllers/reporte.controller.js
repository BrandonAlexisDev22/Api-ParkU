/**
 * @swagger
 * tags:
 *   name: Reportes
 *   description: Endpoints para gestionar reportes
 */

const svc = require('../services/reporte.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * /reportes:
 *   get:
 *     summary: Obtener todos los reportes
 *     tags: [Reportes]
 *     responses:
 *       200:
 *         description: Lista de todos los reportes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reporte'
 */
const getAll = async (req, res) => { 
  try { res.json(await svc.getAll()); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /reportes/{id}:
 *   get:
 *     summary: Obtener un reporte por ID
 *     tags: [Reportes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del reporte
 *     responses:
 *       200:
 *         description: Reporte encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reporte'
 *       404:
 *         description: Reporte no encontrado
 */
const getById = async (req, res) => { 
  try { res.json(await svc.getById(req.params.id)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /reportes/parqueadero/{parqueaderoId}:
 *   get:
 *     summary: Obtener reportes por parqueadero
 *     tags: [Reportes]
 *     parameters:
 *       - in: path
 *         name: parqueaderoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del parqueadero
 *     responses:
 *       200:
 *         description: Lista de reportes del parqueadero
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reporte'
 */
const getByParqueadero = async (req, res) => { 
  try { res.json(await svc.getByParqueadero(req.params.parqueaderoId)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /reportes:
 *   post:
 *     summary: Crear un nuevo reporte
 *     tags: [Reportes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reporte'
 *     responses:
 *       201:
 *         description: Reporte creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reporte'
 */
const create = async (req, res) => { 
  try { res.status(201).json(await svc.create(req.body)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /reportes/{id}:
 *   put:
 *     summary: Actualizar un reporte por ID
 *     tags: [Reportes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del reporte
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reporte'
 *     responses:
 *       200:
 *         description: Reporte actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reporte'
 */
const update = async (req, res) => { 
  try { res.json(await svc.update(req.params.id, req.body)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /reportes/{id}:
 *   delete:
 *     summary: Eliminar un reporte por ID
 *     tags: [Reportes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del reporte
 *     responses:
 *       204:
 *         description: Reporte eliminado correctamente
 */
const remove = async (req, res) => { 
  try { await svc.remove(req.params.id); res.status(204).send(); } 
  catch(e) { handleError(res,e); } 
};

module.exports = { getAll, getById, getByParqueadero, create, update, remove };

/**
 * @swagger
 * components:
 *   schemas:
 *     Reporte:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del reporte
 *         id_parqueadero:
 *           type: integer
 *           description: ID del parqueadero asociado
 *         titulo:
 *           type: string
 *           description: Título del reporte
 *         descripcion:
 *           type: string
 *           description: Descripción detallada del reporte
 *         fecha:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del reporte
 *       required:
 *         - id_parqueadero
 *         - titulo
 *         - descripcion
 *         - fecha
 */