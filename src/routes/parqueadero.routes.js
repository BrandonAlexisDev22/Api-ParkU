const router = require('express').Router();
const ctrl   = require('../controllers/parqueadero.controller');

/**
 * @swagger
 * tags:
 * name: Parqueaderos
 * description: Administración de sedes y ubicaciones físicas
 */

/**
 * @swagger
 * /api/parqueaderos:
 * get:
 * summary: Obtiene la lista de todos los parqueaderos
 * tags: [Parqueaderos]
 * responses:
 * 200:
 * description: Lista de sedes obtenida con éxito
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/Parqueadero'
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/parqueaderos/{id}:
 * get:
 * summary: Obtiene un parqueadero por su ID
 * tags: [Parqueaderos]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * description: ID único de la sede
 * responses:
 * 200:
 * description: Datos del parqueadero encontrados
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Parqueadero'
 * 404:
 * description: Parqueadero no encontrado
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/parqueaderos:
 * post:
 * summary: Crea una nueva sede de parqueadero
 * tags: [Parqueaderos]
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
 * example: "Sede Centro"
 * ubicacion:
 * type: string
 * example: "Calle 10 #45-20"
 * descripcion:
 * type: string
 * example: "Parqueadero cubierto con 50 celdas"
 * responses:
 * 201:
 * description: Sede creada exitosamente
 * 400:
 * description: El nombre es requerido
 * 409:
 * description: Ya existe un parqueadero con ese nombre
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/parqueaderos/{id}:
 * put:
 * summary: Actualiza la información de una sede
 * tags: [Parqueaderos]
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
 * $ref: '#/components/schemas/Parqueadero'
 * responses:
 * 200:
 * description: Información actualizada
 * 404:
 * description: Sede no encontrada
 * 409:
 * description: El nuevo nombre ya está en uso por otra sede
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/parqueaderos/{id}:
 * delete:
 * summary: Elimina una sede del sistema
 * tags: [Parqueaderos]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Sede eliminada correctamente
 * 404:
 * description: Parqueadero no encontrado
 */
router.delete('/:id', ctrl.remove);

module.exports = router;