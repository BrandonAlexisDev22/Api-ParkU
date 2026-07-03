const router = require('express').Router();
const ctrl = require('../controllers/rol.controller');
// const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Gestión de niveles de acceso y tipos de cuenta
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Obtiene todos los roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Lista de roles obtenida
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Rol'
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Obtiene un rol por ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del rol
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rol'
 *       404:
 *         description: Rol no encontrado
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Crea un nuevo rol
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RolCreate'
 *     responses:
 *       201:
 *         description: Rol creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rol'
 *       400:
 *         description: Datos inválidos o faltantes
 *       409:
 *         description: El nombre del rol ya existe
 */
router.post('/',
  // verificarToken, verificarRol(['admin']),
  ctrl.create
);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Actualiza un rol (parcial o total)
 *     tags: [Roles]
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
 *             $ref: '#/components/schemas/RolUpdate'
 *     responses:
 *       200:
 *         description: Rol actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rol'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Rol no encontrado
 *       409:
 *         description: Conflicto - nombre duplicado
 */
router.put('/:id',
  // verificarToken, verificarRol(['admin']),
  ctrl.update
);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Elimina un rol
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Rol eliminado correctamente
 *       404:
 *         description: Rol no encontrado
 *       409:
 *         description: No se puede eliminar porque está asignado a algún usuario
 */
router.delete('/:id',
  // verificarToken, verificarRol(['admin']),
  ctrl.remove
);

module.exports = router;