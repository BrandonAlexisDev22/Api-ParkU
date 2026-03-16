/**
 * @swagger
 * tags:
 *   name: RolPermisos
 *   description: Endpoints para gestionar la relación entre roles y permisos
 */

const svc = require('../services/rolPermiso.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * /rolpermisos:
 *   get:
 *     summary: Obtener todas las relaciones rol-permiso
 *     tags: [RolPermisos]
 *     responses:
 *       200:
 *         description: Lista de todas las relaciones rol-permiso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RolPermiso'
 */
const getAll = async (req, res) => { 
  try { res.json(await svc.getAll()); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /rolpermisos/rol/{rolId}:
 *   get:
 *     summary: Obtener relaciones por ID de rol
 *     tags: [RolPermisos]
 *     parameters:
 *       - in: path
 *         name: rolId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Lista de permisos asociados al rol
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RolPermiso'
 */
const getByRol = async (req, res) => { 
  try { res.json(await svc.getByRol(req.params.rolId)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /rolpermisos:
 *   post:
 *     summary: Crear una relación rol-permiso
 *     tags: [RolPermisos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rol:
 *                 type: integer
 *                 description: ID del rol
 *               permiso:
 *                 type: integer
 *                 description: ID del permiso
 *             required:
 *               - rol
 *               - permiso
 *     responses:
 *       201:
 *         description: Relación creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RolPermiso'
 */
const create = async (req, res) => { 
  try { res.status(201).json(await svc.create(req.body.rol, req.body.permiso)); } 
  catch(e) { handleError(res,e); } 
};

/**
 * @swagger
 * /rolpermisos/{id}:
 *   delete:
 *     summary: Eliminar una relación rol-permiso por ID
 *     tags: [RolPermisos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la relación
 *     responses:
 *       204:
 *         description: Relación eliminada correctamente
 */
const remove = async (req, res) => { 
  try { await svc.remove(req.params.id); res.status(204).send(); } 
  catch(e) { handleError(res,e); } 
};

module.exports = { getAll, getByRol, create, remove };

/**
 * @swagger
 * components:
 *   schemas:
 *     RolPermiso:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID de la relación rol-permiso
 *         rol:
 *           type: integer
 *           description: ID del rol
 *         permiso:
 *           type: integer
 *           description: ID del permiso
 *       required:
 *         - rol
 *         - permiso
 */