const router = require('express').Router();
const ctrl = require('../controllers/novedades.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Novedades
 *   description: Gestión de incidentes, novedades y evidencias
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Novedad:
 *       type: object
 *       required:
 *         - descripcion
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental de la novedad.
 *         vehiculo:
 *           type: integer
 *           nullable: true
 *           description: ID del vehículo relacionado.
 *         encargado:
 *           type: string
 *           nullable: true
 *           description: Persona que reporta o atiende la novedad.
 *         descripcion:
 *           type: string
 *           description: Descripción del incidente.
 *         evidencia:
 *           type: string
 *           nullable: true
 *           description: Ruta o URL de la evidencia.
 *         ingreso_salida:
 *           type: integer
 *           nullable: true
 *           description: ID del movimiento relacionado.
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del registro.
 *         tipo_novedad:
 *           type: string
 *           enum: [DAÑO, ACCIDENTE, MAL_ESTACIONAMIENTO, QUEJA, OTRO]
 *           default: OTRO
 *         prioridad:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA, CRITICA]
 *           default: MEDIA
 *         estado:
 *           type: boolean
 *           default: true
 *           description: true = Pendiente, false = Resuelta.
 *         placa:
 *           type: string
 *           description: Placa del vehículo (solo en respuestas con JOIN).
 *     NovedadCreate:
 *       type: object
 *       required:
 *         - descripcion
 *       properties:
 *         vehiculo:
 *           type: integer
 *           nullable: true
 *         encargado:
 *           type: string
 *           nullable: true
 *         descripcion:
 *           type: string
 *         evidencia:
 *           type: string
 *           nullable: true
 *         ingreso_salida:
 *           type: integer
 *           nullable: true
 *         tipo_novedad:
 *           type: string
 *           enum: [DAÑO, ACCIDENTE, MAL_ESTACIONAMIENTO, QUEJA, OTRO]
 *           default: OTRO
 *         prioridad:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA, CRITICA]
 *           default: MEDIA
 *     NovedadUpdate:
 *       type: object
 *       properties:
 *         encargado:
 *           type: string
 *           nullable: true
 *         descripcion:
 *           type: string
 *         evidencia:
 *           type: string
 *           nullable: true
 *         tipo_novedad:
 *           type: string
 *           enum: [DAÑO, ACCIDENTE, MAL_ESTACIONAMIENTO, QUEJA, OTRO]
 *         prioridad:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA, CRITICA]
 *         estado:
 *           type: boolean
 *           description: true = Pendiente, false = Resuelta.
 */

/**
 * @swagger
 * /api/novedades:
 *   get:
 *     summary: Obtiene todas las novedades
 *     tags: [Novedades]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de novedades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Novedad'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 */
router.get('/',
  verificarToken,
  verificarRol([1, 2]), // Vigilante (1) o Admin (2)
  ctrl.getAll
);

/**
 * @swagger
 * /api/novedades/vehiculo/{vehiculoId}:
 *   get:
 *     summary: Obtiene novedades por vehículo
 *     tags: [Novedades]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehiculoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Novedades del vehículo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Novedad'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 */
router.get('/vehiculo/:vehiculoId',
  verificarToken,
  verificarRol([1, 2]), // Vigilante (1) o Admin (2)
  ctrl.getByVehiculo
);

/**
 * @swagger
 * /api/novedades/movimiento/{movimientoId}:
 *   get:
 *     summary: Obtiene novedades por movimiento
 *     tags: [Novedades]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movimientoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Novedades del movimiento
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Novedad'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 */
router.get('/movimiento/:movimientoId',
  verificarToken,
  verificarRol([1, 2]), // Vigilante (1) o Admin (2)
  ctrl.getByMovimiento
);

/**
 * @swagger
 * /api/novedades/filtros:
 *   get:
 *     summary: Filtra novedades por tipo, prioridad y/o estado
 *     tags: [Novedades]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [DAÑO, ACCIDENTE, MAL_ESTACIONAMIENTO, QUEJA, OTRO]
 *       - in: query
 *         name: prioridad
 *         schema:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA, CRITICA]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Novedades filtradas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Novedad'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 */
router.get('/filtros',
  verificarToken,
  verificarRol([1, 2]), // Vigilante (1) o Admin (2)
  ctrl.getByFiltros
);

/**
 * @swagger
 * /api/novedades/{id}:
 *   get:
 *     summary: Obtiene una novedad por ID
 *     tags: [Novedades]
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
 *         description: Datos de la novedad
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Novedad'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       404:
 *         description: Novedad no encontrada
 */
router.get('/:id',
  verificarToken,
  verificarRol([1, 2]), // Vigilante (1) o Admin (2)
  ctrl.getById
);

/**
 * @swagger
 * /api/novedades:
 *   post:
 *     summary: Crea una nueva novedad
 *     tags: [Novedades]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NovedadCreate'
 *     responses:
 *       201:
 *         description: Novedad creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Novedad'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado - Token requerido
 *       404:
 *         description: Referencia no encontrada
 */
router.post('/',
  verificarToken, // Cualquier usuario autenticado puede crear novedades
  ctrl.create
);

/**
 * @swagger
 * /api/novedades/{id}:
 *   put:
 *     summary: Actualiza una novedad
 *     tags: [Novedades]
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
 *             $ref: '#/components/schemas/NovedadUpdate'
 *     responses:
 *       200:
 *         description: Novedad actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Novedad'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       404:
 *         description: Novedad no encontrada
 */
router.put('/:id',
  verificarToken,
  verificarRol([1, 2]), // Vigilante (1) o Admin (2)
  ctrl.update
);

/**
 * @swagger
 * /api/novedades/{id}:
 *   delete:
 *     summary: Elimina una novedad
 *     tags: [Novedades]
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
 *         description: Novedad eliminada
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Novedad no encontrada
 */
router.delete('/:id',
  verificarToken,
  verificarRol([2]), // Solo Admin (2)
  ctrl.remove
);

module.exports = router;