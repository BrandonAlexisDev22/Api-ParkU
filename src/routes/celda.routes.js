const router = require('express').Router();
const ctrl = require('../controllers/celda.controller');
const disponibilidadCtrl = require('../controllers/disponibilidadCelda.controller');
const historialCtrl = require('../controllers/historial.controller');
const { verificarToken, verificarAcceso } = require('../middlewares/auth.middleware');

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
 *         - numero
 *         - tipo
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental de la celda.
 *         parqueadero:
 *           type: integer
 *           description: ID del parqueadero al que pertenece.
 *         numero:
 *           type: string
 *           description: Numeración de la celda (única dentro de su parqueadero).
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO]
 *           description: Tipo de vehículo que puede ocupar la celda.
 *         usabilidad:
 *           type: string
 *           enum: [GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA, VEHICULO_SENA]
 *           description: Nivel de uso permitido.
 *         estado:
 *           type: string
 *           enum: [DISPONIBLE, OCUPADA, RESERVADA, MANTENIMIENTO, INACTIVA]
 *           description: Estado actual de la celda (solo lectura aquí; usar /celdas/{id}/disponibilidad para cambiarlo).
 *         parqueadero_nombre:
 *           type: string
 *           description: Nombre del parqueadero (solo en respuestas con JOIN).
 *     CeldaCreate:
 *       type: object
 *       required:
 *         - parqueadero
 *         - numero
 *         - tipo
 *       properties:
 *         parqueadero:
 *           type: integer
 *         numero:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO]
 *         usabilidad:
 *           type: string
 *           enum: [GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA, VEHICULO_SENA]
 *           default: GENERAL
 *     CeldaUpdate:
 *       type: object
 *       properties:
 *         numero:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO]
 *         usabilidad:
 *           type: string
 *           enum: [GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA, VEHICULO_SENA]
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
 *           enum: [CARRO, MOTO]
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
 *           enum: [GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA, VEHICULO_SENA]
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
  verificarAcceso({ permisos: ['parqueaderos.gestionar'], roles: [1,2] }), // o quien tenga el permiso
  ctrl.create
);

/**
 * @swagger
 * /api/celdas/parqueadero/{parqueaderoId}/generar-lote:
 *   post:
 *     summary: Genera celdas en lote para un parqueadero, numerándolas automáticamente
 *     description: Recibe cantidades por tipo (carro/moto/movilidad reducida), calcula la siguiente numeración libre por prefijo y crea todas las celdas en una sola transacción.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cantidadCarro:
 *                 type: integer
 *                 minimum: 0
 *               cantidadMoto:
 *                 type: integer
 *                 minimum: 0
 *               cantidadMovilidadReducida:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Celdas creadas con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Celda'
 *       400:
 *         description: Cantidades inválidas, o ninguna cantidad mayor a 0
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       404:
 *         description: Parqueadero no encontrado
 */
router.post('/parqueadero/:parqueaderoId/generar-lote',
  verificarToken,
  verificarAcceso({ permisos: ['parqueaderos.gestionar'], roles: [1,2] }), // o quien tenga el permiso
  ctrl.generarLote
);

router.put('/parqueadero/:parqueaderoId/ajustar-cantidades',
  verificarToken,
  verificarAcceso({ permisos: ['parqueaderos.gestionar'], roles: [1,2] }), // o quien tenga el permiso
  ctrl.ajustarCantidades
);

// Reducción equilibrada: el caller solo dice CUÁNTAS celdas retirar y el backend elige
// cuáles, repartiendo el recorte entre tipos y sin tocar ocupadas ni reservadas.
router.put('/parqueadero/:parqueaderoId/reducir',
  verificarToken,
  verificarAcceso({ permisos: ['parqueaderos.gestionar'], roles: [1,2] }), // o quien tenga el permiso
  ctrl.reducirCeldas
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
  verificarAcceso({ permisos: ['parqueaderos.gestionar'], roles: [1,2] }), // o quien tenga el permiso
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
  verificarAcceso({ permisos: ['parqueaderos.gestionar'], roles: [1] }), // o quien tenga el permiso
  ctrl.remove
);

/**
 * @swagger
 * /api/celdas/{id}/historial:
 *   get:
 *     summary: Historial de cambios de una celda (poblado por trigger)
 *     tags: [Celdas]
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
 *         description: Historial de la celda
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get('/:id/historial',
  verificarToken,
  historialCtrl.getByCelda
);

/**
 * @swagger
 * /api/celdas/{id}/disponibilidad:
 *   get:
 *     summary: Último cambio manual de disponibilidad de una celda
 *     tags: [Celdas]
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
 *         description: Disponibilidad vigente
 *       401:
 *         description: No autorizado - Token requerido
 *       404:
 *         description: La celda no tiene cambios de disponibilidad registrados
 */
router.get('/:id/disponibilidad',
  verificarToken,
  disponibilidadCtrl.getByCelda
);

/**
 * @swagger
 * /api/celdas/{id}/disponibilidad/historial:
 *   get:
 *     summary: Histórico de cambios manuales de disponibilidad de una celda
 *     tags: [Celdas]
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
 *         description: Histórico de disponibilidad
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get('/:id/disponibilidad/historial',
  verificarToken,
  disponibilidadCtrl.getHistorialPorCelda
);

/**
 * @swagger
 * /api/celdas/{id}/disponibilidad:
 *   put:
 *     summary: Cambia manualmente el estado de una celda (mantenimiento, inactivar, reactivar)
 *     tags: [Celdas]
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
 *             $ref: '#/components/schemas/DisponibilidadCeldaCambiar'
 *     responses:
 *       200:
 *         description: Disponibilidad actualizada
 *       400:
 *         description: Falta o es inválido el estado/motivo
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       404:
 *         description: Celda no encontrada
 */
router.put('/:id/disponibilidad',
  verificarToken,
  verificarAcceso({ permisos: ['parqueaderos.gestionar'], roles: [1,2] }), // o quien tenga el permiso
  disponibilidadCtrl.cambiar
);

module.exports = router;