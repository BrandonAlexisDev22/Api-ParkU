/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Endpoints para gestionar roles de usuario
 */

const svc = require('../services/rol.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Obtener todos los roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Lista de todos los roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Rol'
 */
const getAll = async (req, res) => { 
  try { res.json(await svc.getAll()); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     summary: Obtener un rol por ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Rol encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rol'
 *       404:
 *         description: Rol no encontrado
 */
const getById = async (req, res) => { 
  try { res.json(await svc.getById(req.params.id)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Crear un nuevo rol
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del rol
 *             required:
 *               - nombre
 *     responses:
 *       201:
 *         description: Rol creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rol'
 */
const create = async (req, res) => { 
  try { res.status(201).json(await svc.create(req.body.nombre)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     summary: Actualizar un rol por ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nuevo nombre del rol
 *             required:
 *               - nombre
 *     responses:
 *       200:
 *         description: Rol actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rol'
 */
const update = async (req, res) => { 
  try { res.json(await svc.update(req.params.id, req.body.nombre)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     summary: Eliminar un rol por ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     responses:
 *       204:
 *         description: Rol eliminado correctamente
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
 *     Rol:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del rol
 *         nombre:
 *           type: string
 *           description: Nombre del rol
 *       required:
 *         - nombre
 */