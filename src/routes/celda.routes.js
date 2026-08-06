const router = require('express').Router();
const ctrl = require('../controllers/celda.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Celdas
 *   description: Gestión de espacios físicos de parqueo
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Celda:
 *       type: object
 *       required:
 *         - parqueadero
 *         - tipo
 *         - usabilidad
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental de la celda.
 *         parqueadero:
 *           type: integer
 *           description: ID del parqueadero al que pertenece.
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO, MOVILIDAD_REDUCIDA, BICICLETA]
 *           description: Tipo de vehículo que puede ocupar la celda.
 *         usabilidad:
 *           type: string
 *           enum: [GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA]
 *           description: Nivel de uso permitido.
 *         estado_celda:
 *           type: string
 *           enum: [DISPONIBLE, OCUPADO, MANTENIMIENTO, INACTIVA]
 *           description: Estado actual de la celda.
 *         parqueadero_nombre:
 *           type: string
 *           description: Nombre del parqueadero (solo en respuestas con JOIN).
 *     CeldaCreate:
 *       type: object
 *       required:
 *         - parqueadero
 *         - tipo
 *         - usabilidad
 *       properties:
 *         parqueadero:
 *           type: integer
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO, MOVILIDAD_REDUCIDA, BICICLETA]
 *         usabilidad:
 *           type: string
 *           enum: [GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA]
 *         estado_celda:
 *           type: string
 *           enum: [DISPONIBLE, OCUPADO, MANTENIMIENTO, INACTIVA]
 *           default: DISPONIBLE
 *     CeldaUpdate:
 *       type: object
 *       properties:
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO, MOVILIDAD_REDUCIDA, BICICLETA]
 *         usabilidad:
 *           type: string
 *           enum: [GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA]
 *         estado_celda:
 *           type: string
 *           enum: [DISPONIBLE, OCUPADO, MANTENIMIENTO, INACTIVA]
 */

/**
 * @swagger
 * /api/celdas:
 *   get:
 *     summary: Obtiene todas las celdas
 *     tags: [Celdas]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas las celdas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Celda'
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get('/',
  verificarToken,
  ctrl.getAll
);

/**
 * @swagger
 * /api/celdas/parqueadero/{parqueaderoId}/disponibles:
 *   get:
 *     summary: Lista solo las celdas disponibles de un parqueadero
 *     tags: [Celdas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parqueaderoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del parqueadero
 *     responses:
 *       200:
 *         description: Celdas libres para parquear
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Celda'
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get('/parqueadero/:parqueaderoId/disponibles',
  verificarToken,
  ctrl.getDisponibles
);

/**
 * @swagger
 * /api/celdas/parqueadero/{parqueaderoId}:
 *   get:
 *     summary: Obtiene celdas por ID de parqueadero
 *     tags: [Celdas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parqueaderoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del parqueadero a consultar
 *     responses:
 *       200:
 *         description: Lista de celdas del parqueadero
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Celda'
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get('/parqueadero/:parqueaderoId',
  verificarToken,
  ctrl.getByParqueadero
);

/**
 * @swagger
 * /api/celdas/tipo/{tipo}:
 *   get:
 *     summary: Obtiene celdas por tipo de vehículo
 *     tags: [Celdas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CARRO, MOTO, MOVILIDAD_REDUCIDA, BICICLETA]
 *         description: Tipo de vehículo
 *     responses:
 *       200:
 *         description: Lista de celdas del tipo indicado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Celda'
 *       400:
 *         description: Tipo no válido
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get('/tipo/:tipo',
  verificarToken,
  ctrl.getByTipo
);

/**
 * @swagger
 * /api/celdas/usabilidad/{usabilidad}:
 *   get:
 *     summary: Obtiene celdas por usabilidad
 *     tags: [Celdas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usabilidad
 *         required: true
 *         schema:
 *           type: string
 *           enum: [GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA]
 *         description: Nivel de usabilidad
 *     responses:
 *       200:
 *         description: Lista de celdas con esa usabilidad
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Celda'
 *       400:
 *         description: Usabilidad no válida
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get('/usabilidad/:usabilidad',
  verificarToken,
  ctrl.getByUsabilidad
);

/**
 * @swagger
 * /api/celdas/{id}:
 *   get:
 *     summary: Obtiene una celda por su ID
 *     tags: [Celdas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la celda
 *     responses:
 *       200:
 *         description: Datos de la celda
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Celda'
 *       401:
 *         description: No autorizado - Token requerido
 *       404:
 *         description: Celda no encontrada
 */
router.get('/:id',
  verificarToken,
  ctrl.getById
);

/**
 * @swagger
 * /api/celdas:
 *   post:
 *     summary: Crea una nueva celda
 *     tags: [Celdas]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CeldaCreate'
 *     responses:
 *       201:
 *         description: Celda creada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Celda'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       404:
 *         description: Parqueadero no encontrado
 */
router.post('/',
  verificarToken,
  verificarRol([1, 2]), // Vigilante (1) o Admin (2)
  ctrl.create
);

/**
 * @swagger
 * /api/celdas/{id}:
 *   put:
 *     summary: Actualiza una celda (parcial o totalmente)
 *     tags: [Celdas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la celda a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CeldaUpdate'
 *     responses:
 *       200:
 *         description: Celda actualizada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Celda'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       404:
 *         description: Celda no encontrada
 */
router.put('/:id',
  verificarToken,
  verificarRol([1, 2]), // Vigilante (1) o Admin (2)
  ctrl.update
);

/**
 * @swagger
 * /api/celdas/{id}:
 *   delete:
 *     summary: Elimina una celda
 *     tags: [Celdas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la celda a eliminar
 *     responses:
 *       204:
 *         description: Celda eliminada correctamente
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Celda no encontrada
 */
router.delete('/:id',
  verificarToken,
  verificarRol([2]), // Solo Admin (2)
  ctrl.remove
);

module.exports = router;