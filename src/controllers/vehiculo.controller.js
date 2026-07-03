/**
 * @swagger
 * tags:
 *   name: Vehículos
 *   description: Endpoints para gestionar vehículos
 */

const svc = require('../services/vehiculo.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     Vehiculo:
 *       type: object
 *       required:
 *         - conductor
 *         - placa
 *       properties:
 *         id:
 *           type: integer
 *         conductor:
 *           type: integer
 *         placa:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO, BICICLETA]
 *         marca:
 *           type: string
 *           nullable: true
 *         modelo:
 *           type: string
 *           nullable: true
 *         anio:
 *           type: integer
 *           nullable: true
 *         color:
 *           type: string
 *           nullable: true
 *         descripcion:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: boolean
 *         conductor_nombre:
 *           type: string
 *     VehiculoCreate:
 *       type: object
 *       required:
 *         - conductor
 *         - placa
 *       properties:
 *         conductor:
 *           type: integer
 *         placa:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO, BICICLETA]
 *         marca:
 *           type: string
 *           nullable: true
 *         modelo:
 *           type: string
 *           nullable: true
 *         anio:
 *           type: integer
 *           nullable: true
 *         color:
 *           type: string
 *           nullable: true
 *         descripcion:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: boolean
 *           default: true
 *     VehiculoUpdate:
 *       type: object
 *       properties:
 *         conductor:
 *           type: integer
 *         placa:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO, BICICLETA]
 *         marca:
 *           type: string
 *           nullable: true
 *         modelo:
 *           type: string
 *           nullable: true
 *         anio:
 *           type: integer
 *           nullable: true
 *         color:
 *           type: string
 *           nullable: true
 *         descripcion:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: boolean
 */

/**
 * @swagger
 * /vehiculos:
 *   get:
 *     summary: Obtener todos los vehículos
 *     tags: [Vehículos]
 *     responses:
 *       200:
 *         description: Lista de todos los vehículos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehiculo'
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
 * /vehiculos/{id}:
 *   get:
 *     summary: Obtener un vehículo por ID
 *     tags: [Vehículos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     responses:
 *       200:
 *         description: Vehículo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehiculo'
 *       404:
 *         description: Vehículo no encontrado
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
 * /vehiculos/conductor/{conductorId}:
 *   get:
 *     summary: Obtener vehículos por conductor
 *     tags: [Vehículos]
 *     parameters:
 *       - in: path
 *         name: conductorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor
 *     responses:
 *       200:
 *         description: Lista de vehículos del conductor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehiculo'
 */
const getByConductor = async (req, res) => {
  try {
    const data = await svc.getByConductor(req.params.conductorId);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /vehiculos:
 *   post:
 *     summary: Crear un nuevo vehículo
 *     tags: [Vehículos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehiculoCreate'
 *     responses:
 *       201:
 *         description: Vehículo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehiculo'
 *       400:
 *         description: Datos inválidos o faltantes
 *       404:
 *         description: Conductor no encontrado
 *       409:
 *         description: La placa ya está registrada
 */
const create = async (req, res) => {
  try {
    const newVehiculo = await svc.create(req.body);
    res.status(201).json(newVehiculo);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /vehiculos/{id}:
 *   put:
 *     summary: Actualizar un vehículo (parcial o total)
 *     tags: [Vehículos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehiculoUpdate'
 *     responses:
 *       200:
 *         description: Vehículo actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehiculo'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Vehículo no encontrado
 *       409:
 *         description: Conflicto de placa
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
 * /vehiculos/{id}:
 *   delete:
 *     summary: Eliminar un vehículo por ID
 *     tags: [Vehículos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     responses:
 *       204:
 *         description: Vehículo eliminado correctamente
 *       404:
 *         description: Vehículo no encontrado
 *       409:
 *         description: No se puede eliminar porque tiene registros asociados
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
  getByConductor,
  create,
  update,
  remove,
};