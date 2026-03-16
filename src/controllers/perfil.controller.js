/**
 * @swagger
 * tags:
 *   name: Perfiles
 *   description: Endpoints para gestionar perfiles de usuario
 */

const svc = require('../services/perfil.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * /perfiles:
 *   get:
 *     summary: Obtener todos los perfiles
 *     tags: [Perfiles]
 *     responses:
 *       200:
 *         description: Lista de todos los perfiles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Perfil'
 */
const getAll = async (req, res) => { 
  try { res.json(await svc.getAll()); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /perfiles/{id}:
 *   get:
 *     summary: Obtener un perfil por ID
 *     tags: [Perfiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del perfil
 *     responses:
 *       200:
 *         description: Perfil encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Perfil'
 *       404:
 *         description: Perfil no encontrado
 */
const getById = async (req, res) => { 
  try { res.json(await svc.getById(req.params.id)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /perfiles:
 *   post:
 *     summary: Crear un nuevo perfil
 *     tags: [Perfiles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Perfil'
 *     responses:
 *       201:
 *         description: Perfil creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Perfil'
 */
const create = async (req, res) => { 
  try { res.status(201).json(await svc.create(req.body)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /perfiles/{id}:
 *   put:
 *     summary: Actualizar un perfil por ID
 *     tags: [Perfiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del perfil
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Perfil'
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Perfil'
 */
const update = async (req, res) => { 
  try { res.json(await svc.update(req.params.id, req.body)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /perfiles/{id}:
 *   delete:
 *     summary: Eliminar un perfil por ID
 *     tags: [Perfiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del perfil
 *     responses:
 *       204:
 *         description: Perfil eliminado correctamente
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
 *     Perfil:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del perfil
 *         nombre:
 *           type: string
 *           description: Nombre del perfil
 *         descripcion:
 *           type: string
 *           description: Descripción del perfil
 *       required:
 *         - nombre
 */