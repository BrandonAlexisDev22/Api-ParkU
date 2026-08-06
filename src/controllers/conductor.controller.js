/**
 * @swagger
 * tags:
 *   name: Conductores
 *   description: Endpoints para gestionar conductores
 */

const svc = require('../services/conductor.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     Conductor:
 *       type: object
 *       required:
 *         - numero_documento
 *         - nombre_apellidos
 *         - direccion
 *         - tipo_usuario_id
 *         - regional_formacion_id
 *         - centro_formacion_id
 *         - programa_formacion_id
 *         - vigencia
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental del conductor.
 *         usuario_id:
 *           type: integer
 *           nullable: true
 *           description: ID de la cuenta de usuario asociada (opcional).
 *         tipo_documento:
 *           type: string
 *           enum: [CC, CE, PAS, TI, NIT]
 *           default: CC
 *         numero_documento:
 *           type: string
 *           description: Número de documento (único junto con tipo_documento).
 *         nombre_apellidos:
 *           type: string
 *         correo:
 *           type: string
 *           format: email
 *           nullable: true
 *         direccion:
 *           type: string
 *         numero_telefonico:
 *           type: string
 *           nullable: true
 *         tipo_usuario_id:
 *           type: integer
 *         regional_formacion_id:
 *           type: integer
 *         centro_formacion_id:
 *           type: integer
 *         programa_formacion_id:
 *           type: integer
 *         vigencia:
 *           type: string
 *           format: date-time
 *         estado:
 *           type: boolean
 *           default: true
 *         tipo_usuario_nombre:
 *           type: string
 *           description: Solo en respuestas (JOIN).
 *         regional_formacion_nombre:
 *           type: string
 *           description: Solo en respuestas (JOIN).
 *         centro_formacion_nombre:
 *           type: string
 *           description: Solo en respuestas (JOIN).
 *         programa_formacion_nombre:
 *           type: string
 *           description: Solo en respuestas (JOIN).
 *     ConductorCreate:
 *       type: object
 *       required:
 *         - numero_documento
 *         - nombre_apellidos
 *         - direccion
 *         - tipo_usuario_id
 *         - regional_formacion_id
 *         - centro_formacion_id
 *         - programa_formacion_id
 *         - vigencia
 *       properties:
 *         usuario_id:
 *           type: integer
 *           nullable: true
 *         tipo_documento:
 *           type: string
 *           enum: [CC, CE, PAS, TI, NIT]
 *           default: CC
 *         numero_documento:
 *           type: string
 *         nombre_apellidos:
 *           type: string
 *         correo:
 *           type: string
 *           format: email
 *           nullable: true
 *         direccion:
 *           type: string
 *         numero_telefonico:
 *           type: string
 *           nullable: true
 *         tipo_usuario_id:
 *           type: integer
 *         regional_formacion_id:
 *           type: integer
 *         centro_formacion_id:
 *           type: integer
 *         programa_formacion_id:
 *           type: integer
 *         vigencia:
 *           type: string
 *           format: date-time
 *         estado:
 *           type: boolean
 *           default: true
 *     ConductorUpdate:
 *       type: object
 *       properties:
 *         usuario_id:
 *           type: integer
 *           nullable: true
 *         tipo_documento:
 *           type: string
 *           enum: [CC, CE, PAS, TI, NIT]
 *         numero_documento:
 *           type: string
 *         nombre_apellidos:
 *           type: string
 *         correo:
 *           type: string
 *           format: email
 *           nullable: true
 *         direccion:
 *           type: string
 *         numero_telefonico:
 *           type: string
 *           nullable: true
 *         tipo_usuario_id:
 *           type: integer
 *         regional_formacion_id:
 *           type: integer
 *         centro_formacion_id:
 *           type: integer
 *         programa_formacion_id:
 *           type: integer
 *         vigencia:
 *           type: string
 *           format: date-time
 *         estado:
 *           type: boolean
 */

/**
 * @swagger
 * /conductores:
 *   get:
 *     summary: Obtener todos los conductores
 *     tags: [Conductores]
 *     responses:
 *       200:
 *         description: Lista de todos los conductores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conductor'
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
 * /conductores/activos:
 *   get:
 *     summary: Obtener solo los conductores activos
 *     tags: [Conductores]
 *     responses:
 *       200:
 *         description: Lista de conductores con estado = true
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conductor'
 */
const getActivos = async (req, res) => {
  try {
    const data = await svc.getActivos();
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /conductores/documento:
 *   get:
 *     summary: Buscar un conductor por tipo y número de documento
 *     tags: [Conductores]
 *     parameters:
 *       - in: query
 *         name: tipo_documento
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CC, CE, PAS, TI, NIT]
 *       - in: query
 *         name: numero_documento
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conductor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conductor'
 *       400:
 *         description: Faltan parámetros
 *       404:
 *         description: No existe conductor con ese documento
 */
const getByDocumento = async (req, res) => {
  try {
    const { tipo_documento, numero_documento } = req.query;
    if (!tipo_documento || !numero_documento) {
      return res.status(400).json({ message: 'tipo_documento y numero_documento son requeridos' });
    }
    const data = await svc.getByDocumento(tipo_documento, numero_documento);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /conductores/correo/{correo}:
 *   get:
 *     summary: Buscar conductores por correo electrónico
 *     tags: [Conductores]
 *     parameters:
 *       - in: path
 *         name: correo
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Correo electrónico
 *     responses:
 *       200:
 *         description: Lista de conductores con ese correo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conductor'
 */
const getByCorreo = async (req, res) => {
  try {
    const data = await svc.getByCorreo(req.params.correo);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /conductores/{id}:
 *   get:
 *     summary: Obtener un conductor por ID
 *     tags: [Conductores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor
 *     responses:
 *       200:
 *         description: Conductor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conductor'
 *       404:
 *         description: Conductor no encontrado
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
 * /conductores:
 *   post:
 *     summary: Crear un nuevo conductor
 *     tags: [Conductores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConductorCreate'
 *     responses:
 *       201:
 *         description: Conductor creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conductor'
 *       400:
 *         description: Datos inválidos o faltantes
 *       404:
 *         description: Alguna referencia (usuario/catálogo) no existe
 *       409:
 *         description: Documento o correo ya registrado
 */
const create = async (req, res) => {
  try {
    const newConductor = await svc.create(req.body);
    res.status(201).json(newConductor);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /conductores/{id}:
 *   put:
 *     summary: Actualizar un conductor (parcial o total)
 *     tags: [Conductores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConductorUpdate'
 *     responses:
 *       200:
 *         description: Conductor actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conductor'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Conductor no encontrado
 *       409:
 *         description: Conflicto con documento o correo duplicado
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
 * /conductores/{id}:
 *   delete:
 *     summary: Eliminar un conductor por ID
 *     tags: [Conductores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor
 *     responses:
 *       204:
 *         description: Conductor eliminado correctamente
 *       404:
 *         description: Conductor no encontrado
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
  getActivos,
  getByDocumento,
  getByCorreo,
  create,
  update,
  remove,
};
