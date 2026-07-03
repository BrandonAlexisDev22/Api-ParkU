const router = require('express').Router();
const ctrl = require('../controllers/vehiculo.controller');
// const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Vehículos
 *   description: Gestión de la flota de vehículos y su vinculación con conductores
 */

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
 *     tags: [Vehículos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehiculoCreate'
 *     responses:
 *       201:
 *         description: Vehículo registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehiculo'
 *       400:
 *         description: Datos faltantes
 *       404:
 *         description: Conductor no encontrado
 *       409:
 *         description: La placa ya existe en el sistema
 */
router.post('/',
  // verificarToken, verificarRol(['admin', 'operador']),
  ctrl.create
);

/**
 * @swagger
 * /api/vehiculos/{id}:
 *   put:
 *     summary: Actualiza la información de un vehículo (parcial o total)
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
 *         description: La nueva placa ya pertenece a otro vehículo
 */
router.put('/:id',
  // verificarToken, verificarRol(['admin', 'operador']),
  ctrl.update
);

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
 *       404:
 *         description: Vehículo no encontrado
 *       409:
 *         description: No se puede eliminar porque tiene registros asociados
 */
router.delete('/:id',
  // verificarToken, verificarRol(['admin']),
  ctrl.remove
);

module.exports = router;