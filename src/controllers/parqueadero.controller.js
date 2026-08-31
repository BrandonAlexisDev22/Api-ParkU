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
 *       properties:
 *         id:
 *           type: integer
 *         nombre:
 *           type: string
 *         ubicacion:
 *           type: string
 *         acceso:
 *           type: string
 *           enum: [REGIONAL, AVENIDA_BOYACA]
 *           description: Portería por la que se accede.
 *         tipo:
 *           type: string
 *           enum: [GENERAL, DOCENTES, ADMINISTRATIVOS, APRENDICES, VISITANTES, MOTOS, VEHICULO_SENA]
 *           description: Público objetivo del parqueadero.
 *         capacidad_maxima:
 *           type: integer
 *         hora_apertura:
 *           type: string
 *           nullable: true
 *         hora_cierre:
 *           type: string
 *           nullable: true
 *         zona:
 *           type: string
 *           nullable: true
 *         piso:
 *           type: string
 *           nullable: true
 *         plano_url:
 *           type: string
 *           nullable: true
 *         observaciones:
 *           type: string
 *           nullable: true
 *         descripcion:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: boolean
 *           default: true
 *           description: Activo/inactivo (solo lectura aquí; usar PATCH /{id}/estado).
 *     ParqueaderoCreate:
 *       type: object
 *       required:
 *         - nombre
 *         - ubicacion
 *       properties:
 *         nombre:
 *           type: string
 *         ubicacion:
 *           type: string
 *         acceso:
 *           type: string
 *           enum: [REGIONAL, AVENIDA_BOYACA]
 *           default: REGIONAL
 *         tipo:
 *           type: string
 *           enum: [GENERAL, DOCENTES, ADMINISTRATIVOS, APRENDICES, VISITANTES, MOTOS, VEHICULO_SENA]
 *           default: GENERAL
 *         capacidad_maxima:
 *           type: integer
 *           default: 0
 *         hora_apertura:
 *           type: string
 *           nullable: true
 *         hora_cierre:
 *           type: string
 *           nullable: true
 *         zona:
 *           type: string
 *           nullable: true
 *         piso:
 *           type: string
 *           nullable: true
 *         plano_url:
 *           type: string
 *           nullable: true
 *         observaciones:
 *           type: string
 *           nullable: true
 *         descripcion:
 *           type: string
 *           nullable: true
 *     ParqueaderoUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *         ubicacion:
 *           type: string
 *         acceso:
 *           type: string
 *           enum: [REGIONAL, AVENIDA_BOYACA]
 *         tipo:
 *           type: string
 *           enum: [GENERAL, DOCENTES, ADMINISTRATIVOS, APRENDICES, VISITANTES, MOTOS, VEHICULO_SENA]
 *         capacidad_maxima:
 *           type: integer
 *         hora_apertura:
 *           type: string
 *           nullable: true
 *         hora_cierre:
 *           type: string
 *           nullable: true
 *         zona:
 *           type: string
 *           nullable: true
 *         piso:
 *           type: string
 *           nullable: true
 *         plano_url:
 *           type: string
 *           nullable: true
 *         observaciones:
 *           type: string
 *           nullable: true
 *         descripcion:
 *           type: string
 *           nullable: true
 *     ParqueaderoCambiarEstado:
 *       type: object
 *       required:
 *         - estado
 *         - motivo
 *       properties:
 *         estado:
 *           type: boolean
 *         motivo:
 *           type: string
 *           description: Obligatorio (HU 03.1.6.2).
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
 *         description: Conflicto - nombre duplicado
 */
const create = async (req, res) => {
  try {
    const newParking = await svc.create(req.body, req.usuario?.id);
    res.status(201).json(newParking);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /parqueaderos/{id}:
 *   put:
 *     summary: Actualizar un parqueadero (parcial o total, sin tocar el estado)
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
 *         description: Conflicto - nombre duplicado
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
 * /parqueaderos/{id}/estado:
 *   patch:
 *     summary: Activa o inactiva un parqueadero (requiere motivo)
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
 *             $ref: '#/components/schemas/ParqueaderoCambiarEstado'
 *     responses:
 *       200:
 *         description: Parqueadero actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parqueadero'
 *       400:
 *         description: Falta el motivo o el estado no es válido
 *       404:
 *         description: Parqueadero no encontrado
 */
const cambiarEstado = async (req, res) => {
  try {
    const updated = await svc.cambiarEstado(req.params.id, req.body.estado, req.body.motivo, req.usuario?.id);
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
 *         description: No se puede eliminar porque tiene celdas asociadas
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
  create,
  update,
  cambiarEstado,
  remove,
};
