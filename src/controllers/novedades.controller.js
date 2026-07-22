/**
 * @swagger
 * tags:
 *   name: Novedades
 *   description: Endpoints para gestionar novedades e incidentes
 */

const svc = require('../services/novedades.service');
const { handleError } = require('../helpers/errorHandler');

// (Los schemas se definen en el servicio, pero los referenciamos aquí)

/**
 * @swagger
 * /novedades:
 *   get:
 *     summary: Obtener todas las novedades
 *     tags: [Novedades]
 *     responses:
 *       200:
 *         description: Lista de todas las novedades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Novedad'
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
 * /novedades/{id}:
 *   get:
 *     summary: Obtener una novedad por ID
 *     tags: [Novedades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la novedad
 *     responses:
 *       200:
 *         description: Novedad encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Novedad'
 *       404:
 *         description: Novedad no encontrada
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
 * /novedades/vehiculo/{vehiculoId}:
 *   get:
 *     summary: Obtener novedades por vehículo
 *     tags: [Novedades]
 *     parameters:
 *       - in: path
 *         name: vehiculoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     responses:
 *       200:
 *         description: Lista de novedades del vehículo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Novedad'
 */
const getByVehiculo = async (req, res) => {
  try {
    const data = await svc.getByVehiculo(req.params.vehiculoId);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /novedades/movimiento/{movimientoId}:
 *   get:
 *     summary: Obtener novedades por movimiento
 *     tags: [Novedades]
 *     parameters:
 *       - in: path
 *         name: movimientoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del movimiento (ingreso_salida)
 *     responses:
 *       200:
 *         description: Lista de novedades del movimiento
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Novedad'
 */
const getByMovimiento = async (req, res) => {
  try {
    const data = await svc.getByMovimiento(req.params.movimientoId);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /novedades/filtros:
 *   get:
 *     summary: Filtrar novedades por tipo, prioridad y/o estado
 *     tags: [Novedades]
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [DAÑO, ACCIDENTE, MAL_ESTACIONAMIENTO, QUEJA, OTRO]
 *       - in: query
 *         name: prioridad
 *         schema:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA, CRITICA]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Novedades filtradas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Novedad'
 */
const getByFiltros = async (req, res) => {
  try {
    const filtros = req.query;
    const data = await svc.getByFiltros(filtros);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /novedades:
 *   post:
 *     summary: Crear una nueva novedad
 *     tags: [Novedades]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NovedadCreate'
 *     responses:
 *       201:
 *         description: Novedad creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Novedad'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Vehículo, movimiento o encargado no encontrado
 */
const create = async (req, res) => {
  try {
    const newItem = await svc.create(req.body);
    res.status(201).json(newItem);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /novedades/{id}:
 *   put:
 *     summary: Actualizar una novedad (parcial o total)
 *     tags: [Novedades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la novedad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NovedadUpdate'
 *     responses:
 *       200:
 *         description: Novedad actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Novedad'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Novedad no encontrada
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
 * /novedades/{id}:
 *   delete:
 *     summary: Eliminar una novedad por ID
 *     tags: [Novedades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la novedad
 *     responses:
 *       204:
 *         description: Novedad eliminada correctamente
 *       404:
 *         description: Novedad no encontrada
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
  getByVehiculo,
  getByMovimiento,
  getByFiltros,
  create,
  update,
  remove,
};