/**
 * @swagger
 * tags:
 *   name: Permisos
 *   description: Endpoints para gestionar permisos
 */

const svc = require('../services/permiso.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * /permisos:
 *   get:
 *     summary: Obtener todos los permisos
 *     tags: [Permisos]
 *     responses:
 *       200:
 *         description: Lista de todos los permisos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Permiso'
 */
const getAll = async (req, res) => { 
  try { res.json(await svc.getAll()); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /permisos/{id}:
 *   get:
 *     summary: Obtener un permiso por ID
 *     tags: [Permisos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del permiso
 *     responses:
 *       200:
 *         description: Permiso encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Permiso'
 *       404:
 *         description: Permiso no encontrado
 */
const getById = async (req, res) => { 
  try { res.json(await svc.getById(req.params.id)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /permisos:
 *   post:
 *     summary: Crear un nuevo permiso
 *     tags: [Permisos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del permiso
 *             required:
 *               - nombre
 *     responses:
 *       201:
 *         description: Permiso creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Permiso'
 */
const create = async (req, res) => { 
  try { res.status(201).json(await svc.create(req.body.nombre)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /permisos/{id}:
 *   put:
 *     summary: Actualizar un permiso por ID
 *     tags: [Permisos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del permiso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del permiso
 *             required:
 *               - nombre
 *     responses:
 *       200:
 *         description: Permiso actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Permiso'
 */
const update = async (req, res) => { 
  try { res.json(await svc.update(req.params.id, req.body.nombre)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /permisos/{id}:
 *   delete:
 *     summary: Eliminar un permiso por ID
 *     tags: [Permisos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del permiso
 *     responses:
 *       204:
 *         description: Permiso eliminado correctamente
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
 *     Permiso:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del permiso
 *         nombre:
 *           type: string
 *           description: Nombre del permiso
 *       required:
 *         - nombre
 */