const router = require('express').Router();
const ctrl   = require('../controllers/celda.controller');

/**
 * @swagger
 * tags:
 * name: Celdas
 * description: Gestión de espacios físicos de parqueo
 */

/**
 * @swagger
 * /api/celdas:
 * get:
 * summary: Obtiene todas las celdas
 * tags: [Celdas]
 * responses:
 * 200:
 * description: Lista de todas las celdas
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/Celda'
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/celdas/parqueadero/{parqueaderoId}:
 * get:
 * summary: Obtiene celdas por ID de parqueadero
 * tags: [Celdas]
 * parameters:
 * - in: path
 * name: parqueaderoId
 * required: true
 * schema:
 * type: integer
 * description: ID del parqueadero a consultar
 * responses:
 * 200:
 * description: Lista de celdas del parqueadero
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/Celda'
 */
router.get('/parqueadero/:parqueaderoId', ctrl.getByParqueadero);

/**
 * @swagger
 * /api/celdas/parqueadero/{parqueaderoId}/disponibles:
 * get:
 * summary: Lista solo las celdas disponibles de un parqueadero
 * tags: [Celdas]
 * parameters:
 * - in: path
 * name: parqueaderoId
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Celdas libres para parquear
 */
router.get('/parqueadero/:parqueaderoId/disponibles', ctrl.getDisponibles);

/**
 * @swagger
 * /api/celdas/{id}:
 * get:
 * summary: Obtiene una celda por su ID
 * tags: [Celdas]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Datos de la celda
 * 404:
 * description: Celda no encontrada
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/celdas:
 * post:
 * summary: Crea una nueva celda
 * tags: [Celdas]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - parqueadero
 * properties:
 * parqueadero:
 * type: integer
 * discapacidad:
 * type: boolean
 * responses:
 * 201:
 * description: Celda creada con éxito
 * 400:
 * description: Datos inválidos
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/celdas/{id}:
 * put:
 * summary: Actualiza una celda
 * tags: [Celdas]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * requestBody:
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Celda'
 * responses:
 * 200:
 * description: Celda actualizada
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/celdas/{id}:
 * delete:
 * summary: Elimina una celda
 * tags: [Celdas]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Celda eliminada
 */
router.delete('/:id', ctrl.remove);

module.exports = router;