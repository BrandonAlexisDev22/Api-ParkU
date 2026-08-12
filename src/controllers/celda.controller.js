/**
 * @swagger
 * tags:
 *   name: Celdas
 *   description: Endpoints para gestionar las celdas de parqueadero
 */

const svc = require('../services/celda.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     Celda:
 *       type: object
 *       required:
 *         - parqueadero
 *         - numero
 *         - tipo
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental de la celda.
 *         parqueadero:
 *           type: integer
 *           description: ID del parqueadero al que pertenece.
 *         numero:
 *           type: string
 *           description: Numeración de la celda (única dentro de su parqueadero).
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO, BICICLETA, CAMION, BUS]
 *           description: Tipo de vehículo que puede ocupar la celda.
 *         usabilidad:
 *           type: string
 *           enum: [GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA, VEHICULO_SENA]
 *           description: Nivel de uso permitido.
 *         estado:
 *           type: string
 *           enum: [DISPONIBLE, OCUPADA, RESERVADA, MANTENIMIENTO, INACTIVA]
 *           description: Estado actual de la celda (solo lectura aquí; usar /celdas/{id}/disponibilidad para cambiarlo).
 *         observaciones:
 *           type: string
 *           nullable: true
 *         parqueadero_nombre:
 *           type: string
 *           description: Nombre del parqueadero (solo en respuestas con JOIN).
 *     CeldaCreate:
 *       type: object
 *       required:
 *         - parqueadero
 *         - numero
 *         - tipo
 *       properties:
 *         parqueadero:
 *           type: integer
 *         numero:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO, BICICLETA, CAMION, BUS]
 *         usabilidad:
 *           type: string
 *           enum: [GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA, VEHICULO_SENA]
 *           default: GENERAL
 *         observaciones:
 *           type: string
 *           nullable: true
 *     CeldaUpdate:
 *       type: object
 *       properties:
 *         numero:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO, BICICLETA, CAMION, BUS]
 *         usabilidad:
 *           type: string
 *           enum: [GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA, VEHICULO_SENA]
 *         observaciones:
 *           type: string
 *           nullable: true
 */

/**
 * @swagger
 * /celdas:
 *   get:
 *     summary: Obtener todas las celdas
 *     tags: [Celdas]
 *     responses:
 *       200:
 *         description: Lista de todas las celdas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Celda'
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
 * /celdas/{id}:
 *   get:
 *     summary: Obtener una celda por ID
 *     tags: [Celdas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la celda
 *     responses:
 *       200:
 *         description: Celda encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Celda'
 *       404:
 *         description: Celda no encontrada
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
 * /celdas/parqueadero/{parqueaderoId}:
 *   get:
 *     summary: Obtener celdas de un parqueadero
 *     tags: [Celdas]
 *     parameters:
 *       - in: path
 *         name: parqueaderoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del parqueadero
 *     responses:
 *       200:
 *         description: Lista de celdas del parqueadero
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Celda'
 */
const getByParqueadero = async (req, res) => {
  try {
    const data = await svc.getByParqueadero(req.params.parqueaderoId);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /celdas/disponibles/{parqueaderoId}:
 *   get:
 *     summary: Obtener celdas disponibles de un parqueadero
 *     tags: [Celdas]
 *     parameters:
 *       - in: path
 *         name: parqueaderoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del parqueadero
 *     responses:
 *       200:
 *         description: Lista de celdas disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Celda'
 */
const getDisponibles = async (req, res) => {
  try {
    const data = await svc.getDisponibles(req.params.parqueaderoId);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /celdas/tipo/{tipo}:
 *   get:
 *     summary: Obtener celdas por tipo de vehículo
 *     tags: [Celdas]
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CARRO, MOTO, MOVILIDAD_REDUCIDA, BICICLETA]
 *         description: Tipo de vehículo
 *     responses:
 *       200:
 *         description: Lista de celdas del tipo indicado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Celda'
 *       400:
 *         description: Tipo no válido
 */
const getByTipo = async (req, res) => {
  try {
    const data = await svc.getByTipo(req.params.tipo);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /celdas/usabilidad/{usabilidad}:
 *   get:
 *     summary: Obtener celdas por usabilidad
 *     tags: [Celdas]
 *     parameters:
 *       - in: path
 *         name: usabilidad
 *         required: true
 *         schema:
 *           type: string
 *           enum: [GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA]
 *         description: Nivel de usabilidad
 *     responses:
 *       200:
 *         description: Lista de celdas con esa usabilidad
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Celda'
 *       400:
 *         description: Usabilidad no válida
 */
const getByUsabilidad = async (req, res) => {
  try {
    const data = await svc.getByUsabilidad(req.params.usabilidad);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /celdas:
 *   post:
 *     summary: Crear una nueva celda
 *     tags: [Celdas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CeldaCreate'
 *     responses:
 *       201:
 *         description: Celda creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Celda'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Parqueadero no encontrado
 */
const create = async (req, res) => {
  try {
    const newCelda = await svc.create(req.body, req.usuario?.id);
    res.status(201).json(newCelda);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /celdas/{id}:
 *   put:
 *     summary: Actualizar una celda (parcialmente o completa)
 *     tags: [Celdas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la celda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CeldaUpdate'
 *     responses:
 *       200:
 *         description: Celda actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Celda'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Celda no encontrada
 */
const update = async (req, res) => {
  try {
    const updated = await svc.update(req.params.id, req.body, req.usuario?.id);
    res.json(updated);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /celdas/{id}:
 *   delete:
 *     summary: Eliminar una celda por ID
 *     tags: [Celdas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la celda
 *     responses:
 *       204:
 *         description: Celda eliminada correctamente
 *       404:
 *         description: Celda no encontrada
 */
const remove = async (req, res) => {
  try {
    await svc.remove(req.params.id, req.usuario?.id);
    res.status(204).send();
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = {
  getAll,
  getById,
  getByParqueadero,
  getDisponibles,
  getByTipo,
  getByUsabilidad,
  create,
  update,
  remove,
};