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
 * components:
 *   schemas:
 *     Permiso:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del permiso
 *         nombre:
 *           type: string
 *           description: Nombre del permiso
 *     PermisoCreate:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         nombre:
 *           type: string
 *     PermisoUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 */

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
  try {
    const data = await svc.getAll();
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
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
  try {
    const data = await svc.getById(req.params.id);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
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
 *             $ref: '#/components/schemas/PermisoCreate'
 *     responses:
 *       201:
 *         description: Permiso creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Permiso'
 *       400:
 *         description: Datos inválidos o faltantes
 *       409:
 *         description: Ya existe un permiso con ese nombre
 */
const create = async (req, res) => {
  try {
    // ✅ Corrección: pasar todo req.body (objeto)
    const newPermiso = await svc.create(req.body);
    res.status(201).json(newPermiso);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /permisos/{id}:
 *   put:
 *     summary: Actualizar un permiso por ID (parcial o total)
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
 *             $ref: '#/components/schemas/PermisoUpdate'
 *     responses:
 *       200:
 *         description: Permiso actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Permiso'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Permiso no encontrado
 *       409:
 *         description: Conflicto - nombre duplicado
 */
const update = async (req, res) => {
  try {
    // ✅ Corrección: pasar req.body (objeto) en lugar de solo el string
    const updated = await svc.update(req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    handleError(res, e);
  }
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
 *       404:
 *         description: Permiso no encontrado
 *       409:
 *         description: No se puede eliminar porque está en uso
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
  getById,
  create,
  update,
  remove,
};