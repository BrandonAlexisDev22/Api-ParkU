const router = require('express').Router();
const ctrl = require('../controllers/novedades.controller');
// const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Novedades
 *   description: Gestión de incidentes, novedades y evidencias
 */

/**
 * @swagger
 * /api/novedades:
 *   get:
 *     summary: Obtiene todas las novedades
 *     tags: [Novedades]
 *     responses:
 *       200:
 *         description: Lista de novedades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Novedad'
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/novedades/vehiculo/{vehiculoId}:
 *   get:
 *     summary: Obtiene novedades por vehículo
 *     tags: [Novedades]
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
 */
router.get('/vehiculo/:vehiculoId', ctrl.getByVehiculo);

/**
 * @swagger
 * /api/novedades/movimiento/{movimientoId}:
 *   get:
 *     summary: Obtiene novedades por movimiento
 *     tags: [Novedades]
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
 */
router.get('/movimiento/:movimientoId', ctrl.getByMovimiento);

/**
 * @swagger
 * /api/novedades/filtros:
 *   get:
 *     summary: Filtra novedades por tipo, prioridad y/o estado
 *     tags: [Novedades]
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
 */
router.get('/filtros', ctrl.getByFiltros);

/**
 * @swagger
 * /api/novedades/{id}:
 *   get:
 *     summary: Obtiene una novedad por ID
 *     tags: [Novedades]
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
 *       404:
 *         description: Novedad no encontrada
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/novedades:
 *   post:
 *     summary: Crea una nueva novedad
 *     tags: [Novedades]
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
 *       404:
 *         description: Referencia no encontrada
 */
router.post('/',
  // verificarToken,
  ctrl.create
);

/**
 * @swagger
 * /api/novedades/{id}:
 *   put:
 *     summary: Actualiza una novedad
 *     tags: [Novedades]
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
 *       404:
 *         description: Novedad no encontrada
 */
router.put('/:id',
  // verificarToken,
  ctrl.update
);

/**
 * @swagger
 * /api/novedades/{id}:
 *   delete:
 *     summary: Elimina una novedad
 *     tags: [Novedades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Novedad eliminada
 *       404:
 *         description: Novedad no encontrada
 */
router.delete('/:id',
  // verificarToken, verificarRol(['admin']),
  ctrl.remove
);

module.exports = router;