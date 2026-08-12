/**
 * @swagger
 * tags:
 *   name: AsignacionVigilante
 *   description: Turnos y parqueaderos asignados a cada vigilante
 */

const svc = require('../services/asignacionVigilante.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     AsignacionVigilante:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         usuario_id:
 *           type: integer
 *         parqueadero_id:
 *           type: integer
 *         turno:
 *           type: string
 *           enum: [MANANA, TARDE, NOCHE]
 *         fecha_inicio:
 *           type: string
 *           format: date
 *         fecha_fin:
 *           type: string
 *           format: date
 *           nullable: true
 *         estado:
 *           type: boolean
 *           default: true
 *         hora_inicio:
 *           type: string
 *           nullable: true
 *         hora_fin:
 *           type: string
 *           nullable: true
 *     AsignacionVigilanteCreate:
 *       type: object
 *       required:
 *         - usuario_id
 *         - parqueadero_id
 *         - turno
 *         - fecha_inicio
 *       properties:
 *         usuario_id:
 *           type: integer
 *         parqueadero_id:
 *           type: integer
 *         turno:
 *           type: string
 *           enum: [MANANA, TARDE, NOCHE]
 *         fecha_inicio:
 *           type: string
 *           format: date
 *         fecha_fin:
 *           type: string
 *           format: date
 *           nullable: true
 *         hora_inicio:
 *           type: string
 *           nullable: true
 *         hora_fin:
 *           type: string
 *           nullable: true
 *     AsignacionVigilanteUpdate:
 *       type: object
 *       properties:
 *         usuario_id:
 *           type: integer
 *         parqueadero_id:
 *           type: integer
 *         turno:
 *           type: string
 *           enum: [MANANA, TARDE, NOCHE]
 *         fecha_inicio:
 *           type: string
 *           format: date
 *         fecha_fin:
 *           type: string
 *           format: date
 *           nullable: true
 *         estado:
 *           type: boolean
 *         hora_inicio:
 *           type: string
 *           nullable: true
 *         hora_fin:
 *           type: string
 *           nullable: true
 */

/**
 * @swagger
 * /asignaciones-vigilante:
 *   get:
 *     summary: Listar todas las asignaciones de vigilantes
 *     tags: [AsignacionVigilante]
 *     responses:
 *       200:
 *         description: Lista de asignaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AsignacionVigilante'
 */
const getAll = async (req, res) => {
  try {
    res.json(await svc.getAll());
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /asignaciones-vigilante/{id}:
 *   get:
 *     summary: Obtener una asignación por ID
 *     tags: [AsignacionVigilante]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Asignación encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AsignacionVigilante'
 *       404:
 *         description: No encontrada
 */
const getById = async (req, res) => {
  try {
    res.json(await svc.getById(req.params.id));
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /asignaciones-vigilante/usuario/{usuarioId}:
 *   get:
 *     summary: Obtener las asignaciones de un vigilante
 *     tags: [AsignacionVigilante]
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Asignaciones del vigilante
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AsignacionVigilante'
 */
const getByUsuario = async (req, res) => {
  try {
    res.json(await svc.getByUsuario(req.params.usuarioId));
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /asignaciones-vigilante:
 *   post:
 *     summary: Crear una asignación de vigilante
 *     tags: [AsignacionVigilante]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AsignacionVigilanteCreate'
 *     responses:
 *       201:
 *         description: Asignación creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AsignacionVigilante'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Usuario o parqueadero no encontrado
 */
const create = async (req, res) => {
  try {
    const nueva = await svc.create(req.body);
    res.status(201).json(nueva);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /asignaciones-vigilante/{id}:
 *   put:
 *     summary: Actualizar una asignación de vigilante
 *     tags: [AsignacionVigilante]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AsignacionVigilanteUpdate'
 *     responses:
 *       200:
 *         description: Asignación actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AsignacionVigilante'
 *       404:
 *         description: No encontrada
 */
const update = async (req, res) => {
  try {
    res.json(await svc.update(req.params.id, req.body));
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /asignaciones-vigilante/{id}:
 *   delete:
 *     summary: Eliminar una asignación de vigilante
 *     tags: [AsignacionVigilante]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Eliminada correctamente
 *       404:
 *         description: No encontrada
 */
const remove = async (req, res) => {
  try {
    await svc.remove(req.params.id);
    res.status(204).send();
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = { getAll, getById, getByUsuario, create, update, remove };
