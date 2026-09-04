const router = require('express').Router();
const ctrl = require('../controllers/vehiculo.controller');
const { verificarToken, verificarRol, verificarAcceso } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Vehículos
 *   description: Gestión de la flota de vehículos y su vinculación con conductores
 */

/**
 * (Los schemas Vehiculo, VehiculoCreate y VehiculoUpdate se documentan
 * en src/controllers/vehiculo.controller.js.)
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

// IMPORTANTE: debe ir antes de GET /:id -- si no, Express tomaría "buscar" como el
// parámetro :id.
router.get('/buscar',
  verificarToken,
  ctrl.buscarPorPlaca
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
  // Los vehículos se gestionan desde la pantalla de Conductores: mismo permiso.
  verificarAcceso({ permisos: ['conductores.gestionar'], roles: [1, 2] }),
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
  // Los vehículos se gestionan desde la pantalla de Conductores: mismo permiso.
  verificarAcceso({ permisos: ['conductores.gestionar'], roles: [1, 2] }),
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
  verificarRol([1]), // Solo Admin (1)
  ctrl.remove
);

/**
 * @swagger
 * /api/vehiculos/{id}/conductores:
 *   post:
 *     summary: Vincula un conductor adicional como copropietario del vehículo
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
 *             type: object
 *             required: [conductor_id]
 *             properties:
 *               conductor_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Copropietario vinculado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehiculo'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       404:
 *         description: Vehículo o conductor no encontrado
 *       409:
 *         description: El conductor ya es propietario de este vehículo
 */
router.post('/:id/conductores',
  verificarToken,
  // Los vehículos se gestionan desde la pantalla de Conductores: mismo permiso.
  verificarAcceso({ permisos: ['conductores.gestionar'], roles: [1, 2] }),
  ctrl.agregarPropietario
);

/**
 * @swagger
 * /api/vehiculos/{id}/conductores/{conductorId}:
 *   delete:
 *     summary: Desvincula a un conductor como propietario del vehículo
 *     tags: [Vehículos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: conductorId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Copropietario desvinculado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehiculo'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       404:
 *         description: El conductor no es propietario de este vehículo
 *       409:
 *         description: Es el propietario principal, o el único propietario del vehículo
 */
router.delete('/:id/conductores/:conductorId',
  verificarToken,
  // Los vehículos se gestionan desde la pantalla de Conductores: mismo permiso.
  verificarAcceso({ permisos: ['conductores.gestionar'], roles: [1, 2] }),
  ctrl.quitarPropietario
);

module.exports = router;