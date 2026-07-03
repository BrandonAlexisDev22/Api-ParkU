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
 * components:
 *   schemas:
 *     Parqueadero:
 *       type: object
 *       required:
 *         - nombre
 *         - ubicacion
 *         - celdas_totales
 *         - celdas_movilidad_reducida
 *         - celdas_motos
 *         - celdas_carros
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental del parqueadero.
 *         nombre:
 *           type: string
 *           description: Nombre del parqueadero.
 *         ubicacion:
 *           type: string
 *           nullable: true
 *           description: Ubicación física del parqueadero.
 *         celdas_totales:
 *           type: integer
 *           description: Total de celdas disponibles.
 *         celdas_movilidad_reducida:
 *           type: integer
 *           description: Total de celdas para movilidad reducida.
 *         celdas_motos:
 *           type: integer
 *           description: Total de celdas para motos.
 *         celdas_carros:
 *           type: integer
 *           description: Total de celdas para carros.
 *         estado:
 *           type: boolean
 *           default: true
 *           description: Estado del parqueadero (activo/inactivo).
 *     ParqueaderoCreate:
 *       type: object
 *       required:
 *         - nombre
 *         - celdas_totales
 *         - celdas_movilidad_reducida
 *         - celdas_motos
 *         - celdas_carros
 *       properties:
 *         nombre:
 *           type: string
 *         ubicacion:
 *           type: string
 *           nullable: true
 *         celdas_totales:
 *           type: integer
 *         celdas_movilidad_reducida:
 *           type: integer
 *         celdas_motos:
 *           type: integer
 *         celdas_carros:
 *           type: integer
 *         estado:
 *           type: boolean
 *           default: true
 *     ParqueaderoUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *         ubicacion:
 *           type: string
 *           nullable: true
 *         celdas_totales:
 *           type: integer
 *         celdas_movilidad_reducida:
 *           type: integer
 *         celdas_motos:
 *           type: integer
 *         celdas_carros:
 *           type: integer
 *         estado:
 *           type: boolean
 */

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
  try {
    const data = await svc.getAll();
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
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
  try {
    const data = await svc.getById(req.params.id);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
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
 *             $ref: '#/components/schemas/ParqueaderoCreate'
 *     responses:
 *       201:
 *         description: Parqueadero creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parqueadero'
 *       400:
 *         description: Datos inválidos o faltantes
 *       409:
 *         description: Conflicto - nombre duplicado (si aplica)
 */
const create = async (req, res) => {
  try {
    const newParking = await svc.create(req.body);
    res.status(201).json(newParking);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /parqueaderos/{id}:
 *   put:
 *     summary: Actualizar un parqueadero (parcial o total)
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
 *             $ref: '#/components/schemas/ParqueaderoUpdate'
 *     responses:
 *       200:
 *         description: Parqueadero actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parqueadero'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Parqueadero no encontrado
 *       409:
 *         description: Conflicto - nombre duplicado (si aplica)
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
 *       404:
 *         description: Parqueadero no encontrado
 *       409:
 *         description: No se puede eliminar porque tiene celdas asociadas (si aplica)
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