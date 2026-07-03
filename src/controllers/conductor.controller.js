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
 *         - nombre
 *         - tipo_documento
 *         - documento
 *         - perfil
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental del conductor.
 *         nombre:
 *           type: string
 *           description: Nombre completo del conductor.
 *         tipo_documento:
 *           type: string
 *           enum: [CC, CE, PAS, TI, NIT]
 *           description: Tipo de documento de identidad.
 *         documento:
 *           type: integer
 *           description: Número de documento (único).
 *         licencia:
 *           type: string
 *           nullable: true
 *           description: Número de licencia de conducción.
 *         correo:
 *           type: string
 *           format: email
 *           nullable: true
 *           description: Correo electrónico.
 *         numero:
 *           type: string
 *           nullable: true
 *           description: Número telefónico.
 *         perfil:
 *           type: integer
 *           description: ID del perfil institucional.
 *         estado:
 *           type: boolean
 *           default: true
 *           description: Estado del conductor (activo/inactivo).
 *         perfil_nombre:
 *           type: string
 *           description: Nombre del perfil (solo en respuestas con JOIN).
 *     ConductorCreate:
 *       type: object
 *       required:
 *         - nombre
 *         - tipo_documento
 *         - documento
 *         - perfil
 *       properties:
 *         nombre:
 *           type: string
 *         tipo_documento:
 *           type: string
 *           enum: [CC, CE, PAS, TI, NIT]
 *         documento:
 *           type: integer
 *         licencia:
 *           type: string
 *           nullable: true
 *         correo:
 *           type: string
 *           format: email
 *           nullable: true
 *         numero:
 *           type: string
 *           nullable: true
 *         perfil:
 *           type: integer
 *         estado:
 *           type: boolean
 *           default: true
 *     ConductorUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *         tipo_documento:
 *           type: string
 *           enum: [CC, CE, PAS, TI, NIT]
 *         documento:
 *           type: integer
 *         licencia:
 *           type: string
 *           nullable: true
 *         correo:
 *           type: string
 *           format: email
 *           nullable: true
 *         numero:
 *           type: string
 *           nullable: true
 *         perfil:
 *           type: integer
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
 * /conductores/documento/{documento}:
 *   get:
 *     summary: Buscar un conductor por su número de documento
 *     tags: [Conductores]
 *     parameters:
 *       - in: path
 *         name: documento
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número de documento
 *     responses:
 *       200:
 *         description: Conductor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conductor'
 *       404:
 *         description: No existe conductor con ese documento
 */
const getByDocumento = async (req, res) => {
  try {
    const data = await svc.getByDocumento(req.params.documento);
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