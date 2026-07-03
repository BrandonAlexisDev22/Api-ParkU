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
 * components:
 *   schemas:
 *     Perfil:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental del perfil.
 *         nombre:
 *           type: string
 *           description: Nombre del perfil (ej. Administrador, Conductor).
 *         descripcion:
 *           type: string
 *           nullable: true
 *           description: Descripción opcional del perfil.
 *     PerfilCreate:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *           nullable: true
 *     PerfilUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *           nullable: true
 */

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
  try {
    const data = await svc.getAll();
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
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
  try {
    const data = await svc.getById(req.params.id);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
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
 *             $ref: '#/components/schemas/PerfilCreate'
 *     responses:
 *       201:
 *         description: Perfil creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Perfil'
 *       400:
 *         description: Datos inválidos o faltantes
 *       409:
 *         description: Ya existe un perfil con ese nombre
 */
const create = async (req, res) => {
  try {
    const newProfile = await svc.create(req.body);
    res.status(201).json(newProfile);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /perfiles/{id}:
 *   put:
 *     summary: Actualizar un perfil (parcial o total)
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
 *             $ref: '#/components/schemas/PerfilUpdate'
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Perfil'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Perfil no encontrado
 *       409:
 *         description: Conflicto - nombre duplicado
 */
const update = async (req, res) => {
  try {
    const updated = await svc.update(req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    handleError(res, e);
  }
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
 *       404:
 *         description: Perfil no encontrado
 *       409:
 *         description: No se puede eliminar porque está en uso por algún usuario/conductor
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