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
 * components:
 *   schemas:
 *     RolPermiso:
 *       type: object
 *       required:
 *         - rol
 *         - permiso
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la asignación.
 *         rol:
 *           type: integer
 *           description: ID del rol.
 *         permiso:
 *           type: integer
 *           description: ID del permiso.
 *         rol_nombre:
 *           type: string
 *           description: Nombre del rol (solo lectura).
 *         permiso_nombre:
 *           type: string
 *           description: Nombre del permiso (solo lectura).
 *     RolPermisoCreate:
 *       type: object
 *       required:
 *         - rol
 *         - permiso
 *       properties:
 *         rol:
 *           type: integer
 *         permiso:
 *           type: integer
 */

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
  try {
    const data = await svc.getAll();
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
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
 *       404:
 *         description: Rol no encontrado (o sin permisos)
 */
const getByRol = async (req, res) => {
  try {
    const data = await svc.getByRol(req.params.rolId);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
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
 *             $ref: '#/components/schemas/RolPermisoCreate'
 *     responses:
 *       201:
 *         description: Relación creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RolPermiso'
 *       400:
 *         description: Datos inválidos o faltantes
 *       404:
 *         description: Rol o permiso no encontrado
 *       409:
 *         description: El permiso ya está asignado a este rol
 */
const create = async (req, res) => {
  try {
    const newRelation = await svc.create(req.body);
    res.status(201).json(newRelation);
  } catch (e) {
    handleError(res, e);
  }
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
 *       404:
 *         description: Relación no encontrada
 */
const remove = async (req, res) => {
  try {
    await svc.remove(req.params.id);
    res.status(204).send();
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = {
  getAll,
  getByRol,
  create,
  remove,
};