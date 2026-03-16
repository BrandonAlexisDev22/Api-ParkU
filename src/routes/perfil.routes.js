const router = require('express').Router();
const ctrl   = require('../controllers/perfil.controller');

/**
 * @swagger
 * tags:
 * name: Perfiles
 * description: Gestión de categorías de usuario (Estudiantes, Empleados, etc.)
 */

/**
 * @swagger
 * /api/perfiles:
 * get:
 * summary: Obtiene todos los perfiles registrados
 * tags: [Perfiles]
 * responses:
 * 200:
 * description: Lista de perfiles cargada exitosamente
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/Perfil'
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/perfiles/{id}:
 * get:
 * summary: Obtiene un perfil por su ID
 * tags: [Perfiles]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * description: ID único del perfil
 * responses:
 * 200:
 * description: Detalle del perfil
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Perfil'
 * 404:
 * description: Perfil no encontrado
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/perfiles:
 * post:
 * summary: Crea un nuevo perfil de usuario
 * tags: [Perfiles]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - nombre
 * properties:
 * nombre:
 * type: string
 * example: "Visitante"
 * descripcion:
 * type: string
 * example: "Usuarios externos a la institución"
 * responses:
 * 201:
 * description: Perfil creado
 * 400:
 * description: El nombre es obligatorio
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/perfiles/{id}:
 * put:
 * summary: Actualiza un perfil existente
 * tags: [Perfiles]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Perfil'
 * responses:
 * 200:
 * description: Perfil actualizado correctamente
 * 400:
 * description: Datos de entrada inválidos
 * 404:
 * description: Perfil no encontrado
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/perfiles/{id}:
 * delete:
 * summary: Elimina un perfil
 * tags: [Perfiles]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Perfil eliminado
 * 404:
 * description: Perfil no encontrado
 */
router.delete('/:id', ctrl.remove);

module.exports = router;