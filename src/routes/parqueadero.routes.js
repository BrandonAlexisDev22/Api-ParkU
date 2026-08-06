const router = require('express').Router();
const ctrl = require('../controllers/parqueadero.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Parqueaderos
 *   description: Administración de sedes y ubicaciones físicas
 */

/**
 * Los esquemas Parqueadero/ParqueaderoCreate/ParqueaderoUpdate se documentan en
 * src/controllers/parqueadero.controller.js para evitar duplicidad.
 */

/**
 * @swagger
 * /api/parqueaderos:
 *   get:
 *     summary: Obtiene la lista de todos los parqueaderos
 *     tags: [Parqueaderos]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sedes obtenida con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Parqueadero'
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get('/',
  verificarToken,
  ctrl.getAll
);

/**
 * @swagger
 * /api/parqueaderos/{id}:
 *   get:
 *     summary: Obtiene un parqueadero por su ID
 *     tags: [Parqueaderos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único de la sede
 *     responses:
 *       200:
 *         description: Datos del parqueadero encontrados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parqueadero'
 *       401:
 *         description: No autorizado - Token requerido
 *       404:
 *         description: Parqueadero no encontrado
 */
router.get('/:id',
  verificarToken,
  ctrl.getById
);

/**
 * @swagger
 * /api/parqueaderos:
 *   post:
 *     summary: Crea una nueva sede de parqueadero
 *     tags: [Parqueaderos]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParqueaderoCreate'
 *     responses:
 *       201:
 *         description: Sede creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parqueadero'
 *       400:
 *         description: Datos inválidos o faltantes
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       409:
 *         description: Ya existe un parqueadero con ese nombre
 */
router.post('/',
  verificarToken,
  verificarRol([2]), // Solo Admin (2)
  ctrl.create
);

/**
 * @swagger
 * /api/parqueaderos/{id}:
 *   put:
 *     summary: Actualiza la información de una sede (parcial o total)
 *     tags: [Parqueaderos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del parqueadero a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParqueaderoUpdate'
 *     responses:
 *       200:
 *         description: Información actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parqueadero'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Parqueadero no encontrado
 *       409:
 *         description: El nuevo nombre ya está en uso por otra sede
 */
router.put('/:id',
  verificarToken,
  verificarRol([2]), // Solo Admin (2)
  ctrl.update
);

/**
 * @swagger
 * /api/parqueaderos/{id}:
 *   delete:
 *     summary: Elimina una sede del sistema
 *     tags: [Parqueaderos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del parqueadero a eliminar
 *     responses:
 *       204:
 *         description: Parqueadero eliminado correctamente
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Parqueadero no encontrado
 *       409:
 *         description: No se puede eliminar porque tiene celdas asociadas (integridad referencial)
 */
router.delete('/:id',
  verificarToken,
  verificarRol([2]), // Solo Admin (2)
  ctrl.remove
);

module.exports = router;