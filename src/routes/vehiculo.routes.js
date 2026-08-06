const router = require('express').Router();
const ctrl = require('../controllers/vehiculo.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Vehículos
 *   description: Gestión de la flota de vehículos y su vinculación con conductores
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Vehiculo:
 *       type: object
 *       required:
 *         - tipo
 *         - marca
 *         - placa
 *         - conductor
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental del vehículo.
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO, CAMIONETA, CAMION, BICICLETA]
 *           description: Tipo de vehículo.
 *         marca:
 *           type: string
 *           description: Marca del vehículo.
 *         modelo:
 *           type: string
 *           nullable: true
 *           description: Modelo del vehículo.
 *         placa:
 *           type: string
 *           description: Placa única del vehículo.
 *         color:
 *           type: string
 *           nullable: true
 *           description: Color del vehículo.
 *         conductor:
 *           type: integer
 *           description: ID del conductor asociado.
 *         observaciones:
 *           type: string
 *           nullable: true
 *           description: Observaciones adicionales.
 *         estado:
 *           type: boolean
 *           default: true
 *           description: true = Activo, false = Inactivo.
 *         conductor_nombre:
 *           type: string
 *           description: Nombre del conductor (solo en respuestas con JOIN).
 *     VehiculoCreate:
 *       type: object
 *       required:
 *         - tipo
 *         - marca
 *         - placa
 *         - conductor
 *       properties:
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO, CAMIONETA, CAMION, BICICLETA]
 *         marca:
 *           type: string
 *         modelo:
 *           type: string
 *           nullable: true
 *         placa:
 *           type: string
 *         color:
 *           type: string
 *           nullable: true
 *         conductor:
 *           type: integer
 *         observaciones:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: boolean
 *           default: true
 *     VehiculoUpdate:
 *       type: object
 *       properties:
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO, CAMIONETA, CAMION, BICICLETA]
 *         marca:
 *           type: string
 *         modelo:
 *           type: string
 *           nullable: true
 *         placa:
 *           type: string
 *         color:
 *           type: string
 *           nullable: true
 *         conductor:
 *           type: integer
 *         observaciones:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: boolean
 */

/**
 * @swagger
 * /api/vehiculos:
 *   get:
 *     summary: Obtiene todos los vehículos registrados
 *     tags: [Vehículos]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de vehículos obtenida con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehiculo'
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get('/',
  verificarToken,
  ctrl.getAll
);

/**
 * @swagger
 * /api/vehiculos/conductor/{conductorId}:
 *   get:
 *     summary: Obtiene vehículos asociados a un conductor específico
 *     tags: [Vehículos]
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get('/conductor/:conductorId',
  verificarToken,
  ctrl.getByConductor
);

/**
 * @swagger
 * /api/vehiculos/{id}:
 *   get:
 *     summary: Obtiene un vehículo por su ID
 *     tags: [Vehículos]
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: No autorizado - Token requerido
 *       404:
 *         description: Vehículo no encontrado
 */
router.get('/:id',
  verificarToken,
  ctrl.getById
);

/**
 * @swagger
 * /api/vehiculos:
 *   post:
 *     summary: Registra un nuevo vehículo
 *     tags: [Vehículos]
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       404:
 *         description: Conductor no encontrado
 *       409:
 *         description: La placa ya existe en el sistema
 */
router.post('/',
  verificarToken,
  verificarRol([1, 2]), // Vigilante (1) o Admin (2)
  ctrl.create
);

/**
 * @swagger
 * /api/vehiculos/{id}:
 *   put:
 *     summary: Actualiza la información de un vehículo (parcial o total)
 *     tags: [Vehículos]
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       404:
 *         description: Vehículo no encontrado
 *       409:
 *         description: La nueva placa ya pertenece a otro vehículo
 */
router.put('/:id',
  verificarToken,
  verificarRol([1, 2]), // Vigilante (1) o Admin (2)
  ctrl.update
);

/**
 * @swagger
 * /api/vehiculos/{id}:
 *   delete:
 *     summary: Elimina un vehículo del sistema
 *     tags: [Vehículos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Vehículo eliminado correctamente
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Vehículo no encontrado
 *       409:
 *         description: No se puede eliminar porque tiene registros asociados
 */
router.delete('/:id',
  verificarToken,
  verificarRol([2]), // Solo Admin (2)
  ctrl.remove
);

module.exports = router;