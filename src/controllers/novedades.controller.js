/**
 * @swagger
 * tags:
 *   name: Novedades
 *   description: Endpoints para gestionar novedades e incidentes
 */

const svc = require('../services/novedades.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     Novedad:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         tipo_novedad:
 *           type: string
 *           enum: [DANIO, ACCIDENTE, MAL_ESTACIONAMIENTO, QUEJA, OTRO]
 *         prioridad:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA, CRITICA]
 *         estado:
 *           type: string
 *           enum: [PENDIENTE, EN_PROCESO, RESUELTA, CERRADA, CANCELADA]
 *         descripcion:
 *           type: string
 *         usuario_reporta_id:
 *           type: integer
 *           description: Quien reporta (se asigna automáticamente al usuario autenticado).
 *         usuario_asignado_id:
 *           type: integer
 *           nullable: true
 *         vehiculo_id:
 *           type: integer
 *           nullable: true
 *         celda_id:
 *           type: integer
 *           nullable: true
 *           description: Ubicación de la novedad.
 *         parqueadero_id:
 *           type: integer
 *           nullable: true
 *         registro_acceso_id:
 *           type: integer
 *           nullable: true
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *         fecha_hora_cierre:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         justificacion_cierre:
 *           type: string
 *           nullable: true
 *     NovedadCreate:
 *       type: object
 *       required:
 *         - descripcion
 *       properties:
 *         tipo_novedad:
 *           type: string
 *           enum: [DANIO, ACCIDENTE, MAL_ESTACIONAMIENTO, QUEJA, OTRO]
 *           default: OTRO
 *         prioridad:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA, CRITICA]
 *           default: MEDIA
 *         descripcion:
 *           type: string
 *         usuario_asignado_id:
 *           type: integer
 *           nullable: true
 *         vehiculo_id:
 *           type: integer
 *           nullable: true
 *         celda_id:
 *           type: integer
 *           nullable: true
 *         parqueadero_id:
 *           type: integer
 *           nullable: true
 *         registro_acceso_id:
 *           type: integer
 *           nullable: true
 *     NovedadUpdate:
 *       type: object
 *       properties:
 *         tipo_novedad:
 *           type: string
 *           enum: [DANIO, ACCIDENTE, MAL_ESTACIONAMIENTO, QUEJA, OTRO]
 *         prioridad:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA, CRITICA]
 *         estado:
 *           type: string
 *           enum: [PENDIENTE, EN_PROCESO, RESUELTA, CERRADA, CANCELADA]
 *         descripcion:
 *           type: string
 *         usuario_asignado_id:
 *           type: integer
 *           nullable: true
 *         vehiculo_id:
 *           type: integer
 *           nullable: true
 *         celda_id:
 *           type: integer
 *           nullable: true
 *         parqueadero_id:
 *           type: integer
 *           nullable: true
 *         registro_acceso_id:
 *           type: integer
 *           nullable: true
 *         fecha_hora_cierre:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         justificacion_cierre:
 *           type: string
 *           nullable: true
 */

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
 * /novedades/registro-acceso/{registroAccesoId}:
 *   get:
 *     summary: Obtener novedades por registro de acceso (ingreso/salida)
 *     tags: [Novedades]
 *     parameters:
 *       - in: path
 *         name: registroAccesoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro de acceso
 *     responses:
 *       200:
 *         description: Lista de novedades del registro de acceso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Novedad'
 */
const getByRegistroAcceso = async (req, res) => {
  try {
    const data = await svc.getByRegistroAcceso(req.params.registroAccesoId);
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
 *         name: tipo_novedad
 *         schema:
 *           type: string
 *           enum: [DANIO, ACCIDENTE, MAL_ESTACIONAMIENTO, QUEJA, OTRO]
 *       - in: query
 *         name: prioridad
 *         schema:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA, CRITICA]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, EN_PROCESO, RESUELTA, CERRADA, CANCELADA]
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
 *         description: Alguna referencia (vehículo, celda, parqueadero, registro de acceso, usuario asignado) no existe
 */
const create = async (req, res) => {
  try {
    const newItem = await svc.create(req.body, req.usuario?.id);
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
    const updated = await svc.update(req.params.id, req.body, req.usuario?.id);
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
  getByRegistroAcceso,
  getByFiltros,
  create,
  update,
  remove,
};
