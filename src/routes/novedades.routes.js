const router = require('express').Router();
const ctrl = require('../controllers/novedades.controller');
const historialCtrl = require('../controllers/historial.controller');
const evidenciaCtrl = require('../controllers/evidenciaNovedad.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { crearUploadMiddleware } = require('../middlewares/upload.middleware');

// Solo actúa sobre requests multipart/form-data (campo "archivo"); un POST con
// application/json y `url` de texto pasa de largo sin tocarlo -- ver
// evidenciaNovedad.controller.js create().
const uploadEvidencia = crearUploadMiddleware({
  subcarpeta: 'evidencias',
  extensionesPermitidas: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'pdf'],
  limiteMB: 15,
  campo: 'archivo',
});

/**
 * @swagger
 * tags:
 *   name: Novedades
 *   description: Gestión de incidentes, novedades y evidencias
 */

/**
 * (Los schemas Novedad, NovedadCreate y NovedadUpdate se documentan
 * en src/controllers/novedades.controller.js.)
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
  verificarRol([1, 2]), // Admin (1) o Vigilante (2)
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
  verificarRol([1, 2]), // Admin (1) o Vigilante (2)
  ctrl.getByVehiculo
);

/**
 * @swagger
 * /api/novedades/registro-acceso/{registroAccesoId}:
 *   get:
 *     summary: Obtiene novedades por registro de acceso (ingreso/salida)
 *     tags: [Novedades]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registroAccesoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Novedades del registro de acceso
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
router.get('/registro-acceso/:registroAccesoId',
  verificarToken,
  verificarRol([1, 2]), // Admin (1) o Vigilante (2)
  ctrl.getByRegistroAcceso
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
 *         name: tipo_novedad
 *         schema:
 *           type: string
 *           enum: [DANIO, ACCIDENTE, MAL_ESTACIONAMIENTO, QUEJA, OTRO]
 *       - in: query
 *         name: prioridad
 *         schema:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA, CRITICA]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, EN_PROCESO, RESUELTA, CERRADA, CANCELADA]
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
  verificarRol([1, 2]), // Admin (1) o Vigilante (2)
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
  verificarRol([1, 2]), // Admin (1) o Vigilante (2)
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
  verificarRol([1, 2]), // Admin (1) o Vigilante (2)
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
  verificarRol([1]), // Solo Admin (1)
  ctrl.remove
);

/**
 * @swagger
 * /api/novedades/{id}/historial:
 *   get:
 *     summary: Historial de cambios de una novedad (poblado por trigger)
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
 *         description: Historial de la novedad
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get('/:id/historial',
  verificarToken,
  historialCtrl.getByNovedad
);

/**
 * @swagger
 * /api/novedades/{id}/evidencias:
 *   get:
 *     summary: Listar las evidencias de una novedad
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
 *         description: Lista de evidencias
 *       401:
 *         description: No autorizado - Token requerido
 *       404:
 *         description: Novedad no encontrada
 */
router.get('/:id/evidencias',
  verificarToken,
  evidenciaCtrl.getByNovedad
);

/**
 * @swagger
 * /api/novedades/{id}/evidencias:
 *   post:
 *     summary: Adjuntar una evidencia a una novedad
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
 *             $ref: '#/components/schemas/EvidenciaNovedadCreate'
 *     responses:
 *       201:
 *         description: Evidencia creada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado - Token requerido
 *       404:
 *         description: Novedad no encontrada
 */
router.post('/:id/evidencias',
  verificarToken,
  uploadEvidencia,
  evidenciaCtrl.create
);

module.exports = router;