const router = require('express').Router();
const ctrl = require('../controllers/perfil.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Perfiles
 *   description: Gestión de categorías de usuario (Estudiantes, Empleados, etc.)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Perfil:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental del perfil.
 *         nombre:
 *           type: string
 *           description: Nombre del perfil.
 *         descripcion:
 *           type: string
 *           nullable: true
 *           description: Descripción opcional.
 *     PerfilCreate:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *           nullable: true
 *     PerfilUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *           nullable: true
 */

/**
 * @swagger
 * /api/perfiles:
 *   get:
 *     summary: Obtiene todos los perfiles registrados
 *     tags: [Perfiles]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de perfiles cargada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Perfil'
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
 * /api/perfiles/{id}:
 *   get:
 *     summary: Obtiene un perfil por su ID
 *     tags: [Perfiles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del perfil
 *     responses:
 *       200:
 *         description: Detalle del perfil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Perfil'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       404:
 *         description: Perfil no encontrado
 */
router.get('/:id',
  verificarToken,
  verificarRol([1, 2]), // Vigilante (1) o Admin (2)
  ctrl.getById
);

/**
 * @swagger
 * /api/perfiles:
 *   post:
 *     summary: Crea un nuevo perfil de usuario
 *     tags: [Perfiles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PerfilCreate'
 *     responses:
 *       201:
 *         description: Perfil creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Perfil'
 *       400:
 *         description: Datos inválidos o faltantes
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       409:
 *         description: Ya existe un perfil con ese nombre
 */
router.post('/',
  verificarToken,
  verificarRol([1, 2]), // Vigilante (1) o Admin (2)
  ctrl.create
);

/**
 * @swagger
 * /api/perfiles/{id}:
 *   put:
 *     summary: Actualiza un perfil existente (parcial o total)
 *     tags: [Perfiles]
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
 *             $ref: '#/components/schemas/PerfilUpdate'
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Perfil'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       404:
 *         description: Perfil no encontrado
 *       409:
 *         description: Conflicto - nombre duplicado
 */
router.put('/:id',
  verificarToken,
  verificarRol([1, 2]), // Vigilante (1) o Admin (2)
  ctrl.update
);

/**
 * @swagger
 * /api/perfiles/{id}:
 *   delete:
 *     summary: Elimina un perfil
 *     tags: [Perfiles]
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
 *         description: Perfil eliminado correctamente
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Perfil no encontrado
 *       409:
 *         description: No se puede eliminar porque está en uso
 */
router.delete('/:id',
  verificarToken,
  verificarRol([2]), // Solo Admin (2)
  ctrl.remove
);

module.exports = router;