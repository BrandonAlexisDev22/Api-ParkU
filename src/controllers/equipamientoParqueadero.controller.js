const svc = require('../services/equipamientoParqueadero.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     EquipamientoParqueadero:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         parqueadero_id:
 *           type: integer
 *         tipo:
 *           type: string
 *           enum: [SENSOR, CAMARA, CARGADOR_ELECTRICO, BARRERA, OTRO]
 *         nombre:
 *           type: string
 *         codigo:
 *           type: string
 *           nullable: true
 *         ubicacion:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: boolean
 *           default: true
 *         observaciones:
 *           type: string
 *           nullable: true
 *         fecha_instalacion:
 *           type: string
 *           format: date-time
 *           nullable: true
 *     EquipamientoParqueaderoCreate:
 *       type: object
 *       required:
 *         - tipo
 *         - nombre
 *       properties:
 *         tipo:
 *           type: string
 *           enum: [SENSOR, CAMARA, CARGADOR_ELECTRICO, BARRERA, OTRO]
 *         nombre:
 *           type: string
 *         codigo:
 *           type: string
 *           nullable: true
 *         ubicacion:
 *           type: string
 *           nullable: true
 *         observaciones:
 *           type: string
 *           nullable: true
 *         fecha_instalacion:
 *           type: string
 *           format: date-time
 *           nullable: true
 *     EquipamientoParqueaderoUpdate:
 *       type: object
 *       properties:
 *         tipo:
 *           type: string
 *           enum: [SENSOR, CAMARA, CARGADOR_ELECTRICO, BARRERA, OTRO]
 *         nombre:
 *           type: string
 *         codigo:
 *           type: string
 *           nullable: true
 *         ubicacion:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: boolean
 *         observaciones:
 *           type: string
 *           nullable: true
 *         fecha_instalacion:
 *           type: string
 *           format: date-time
 *           nullable: true
 */

/**
 * @swagger
 * /parqueaderos/{id}/equipamiento:
 *   get:
 *     summary: Listar el equipamiento de un parqueadero
 *     tags: [Parqueaderos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de equipamiento
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EquipamientoParqueadero'
 *       404:
 *         description: Parqueadero no encontrado
 */
const getByParqueadero = async (req, res) => {
  try {
    res.json(await svc.getByParqueadero(req.params.id));
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /parqueaderos/{id}/equipamiento:
 *   post:
 *     summary: Registrar equipamiento en un parqueadero
 *     tags: [Parqueaderos]
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
 *             $ref: '#/components/schemas/EquipamientoParqueaderoCreate'
 *     responses:
 *       201:
 *         description: Equipamiento creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EquipamientoParqueadero'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Parqueadero no encontrado
 */
const create = async (req, res) => {
  try {
    const nuevo = await svc.create(req.params.id, req.body);
    res.status(201).json(nuevo);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /equipamiento/{id}:
 *   put:
 *     summary: Actualizar equipamiento de un parqueadero
 *     tags: [Parqueaderos]
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
 *             $ref: '#/components/schemas/EquipamientoParqueaderoUpdate'
 *     responses:
 *       200:
 *         description: Equipamiento actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EquipamientoParqueadero'
 *       404:
 *         description: Equipamiento no encontrado
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
 * /equipamiento/{id}:
 *   delete:
 *     summary: Eliminar equipamiento de un parqueadero
 *     tags: [Parqueaderos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Equipamiento eliminado
 *       404:
 *         description: Equipamiento no encontrado
 */
const remove = async (req, res) => {
  try {
    await svc.remove(req.params.id);
    res.status(204).send();
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = { getByParqueadero, create, update, remove };
