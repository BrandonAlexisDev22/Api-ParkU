/**
 * @swagger
 * tags:
 *   name: Vehículos
 *   description: Gestión de la flota de vehículos y su vinculación con conductores
 */

const router = require('express').Router();
const ctrl   = require('../controllers/vehiculo.controller');

/**
 * @swagger
 * /api/vehiculos:
 *   get:
 *     summary: Obtiene todos los vehículos registrados
 *     tags: [Vehículos]
 *     responses:
 *       200:
 *         description: Lista de vehículos obtenida con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehiculo'
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/vehiculos/conductor/{conductorId}:
 *   get:
 *     summary: Obtiene vehículos asociados a un conductor específico
 *     tags: [Vehículos]
 *     parameters:
 *       - in: path
 *         name: conductorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor para consultar sus vehículos
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
router.get('/conductor/:conductorId', ctrl.getByConductor);

/**
 * @swagger
 * /api/vehiculos/{id}:
 *   get:
 *     summary: Obtiene un vehículo por su ID
 *     tags: [Vehículos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos detallados del vehículo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehiculo'
 *       404:
 *         description: Vehículo no encontrado
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/vehiculos:
 *   post:
 *     summary: Registra un nuevo vehículo
 *     description: Vincula un vehículo a un conductor y valida que la placa no esté duplicada.
 *     tags: [Vehículos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conductor
 *               - placa
 *             properties:
 *               conductor:
 *                 type: integer
 *                 description: ID del conductor propietario
 *               placa:
 *                 type: string
 *                 example: "ABC-123"
 *               marca:
 *                 type: string
 *               modelo:
 *                 type: string
 *               color:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [Carro, Moto, Bicicleta]
 *     responses:
 *       201:
 *         description: Vehículo registrado exitosamente
 *       400:
 *         description: Datos faltantes (conductor o placa)
 *       404:
 *         description: Conductor no encontrado
 *       409:
 *         description: La placa ya existe en el sistema
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/vehiculos/{id}:
 *   put:
 *     summary: Actualiza la información de un vehículo
 *     tags: [Vehículos]
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
 *             $ref: '#/components/schemas/Vehiculo'
 *     responses:
 *       200:
 *         description: Vehículo actualizado
 *       409:
 *         description: La nueva placa ya pertenece a otro vehículo
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/vehiculos/{id}:
 *   delete:
 *     summary: Elimina un vehículo del sistema
 *     tags: [Vehículos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Vehículo eliminado correctamente
 */
router.delete('/:id', ctrl.remove);

module.exports = router;