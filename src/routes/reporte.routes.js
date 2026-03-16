const router = require('express').Router();
const ctrl   = require('../controllers/reporte.controller');

/**
 * @swagger
 * tags:
 * name: Reportes
 * description: Gestión de incidentes, novedades y evidencias en los parqueaderos
 */

/**
 * @swagger
 * /api/reportes:
 * get:
 * summary: Obtiene todos los reportes registrados
 * tags: [Reportes]
 * responses:
 * 200:
 * description: Lista de reportes obtenida con éxito
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/Reporte'
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/reportes/parqueadero/{parqueaderoId}:
 * get:
 * summary: Obtiene reportes asociados a una sede específica
 * tags: [Reportes]
 * parameters:
 * - in: path
 * name: parqueaderoId
 * required: true
 * schema:
 * type: integer
 * description: ID del parqueadero a consultar
 * responses:
 * 200:
 * description: Lista de reportes de la sede
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/Reporte'
 */
router.get('/parqueadero/:parqueaderoId', ctrl.getByParqueadero);

/**
 * @swagger
 * /api/reportes/{id}:
 * get:
 * summary: Obtiene un reporte por su ID
 * tags: [Reportes]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Datos detallados del reporte
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Reporte'
 * 404:
 * description: Reporte no encontrado
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/reportes:
 * post:
 * summary: Crea un nuevo reporte de incidencia
 * tags: [Reportes]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - descripcion
 * properties:
 * descripcion:
 * type: string
 * example: "Fuga de aceite en la celda 15"
 * parqueadero:
 * type: integer
 * description: ID de la sede (opcional)
 * vehiculo:
 * type: integer
 * description: ID del vehículo involucrado (opcional)
 * evidencia:
 * type: string
 * description: URL de la imagen o archivo adjunto
 * responses:
 * 201:
 * description: Reporte creado exitosamente
 * 404:
 * description: El parqueadero o vehículo indicado no existen
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/reportes/{id}:
 * put:
 * summary: Actualiza la información de un reporte
 * tags: [Reportes]
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
 * $ref: '#/components/schemas/Reporte'
 * responses:
 * 200:
 * description: Reporte actualizado
 * 404:
 * description: Reporte no encontrado
 */
router.put('/:id', ctrl.update);

/**
 * @swagger
 * /api/reportes/{id}:
 * delete:
 * summary: Elimina un reporte del historial
 * tags: [Reportes]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Reporte eliminado correctamente
 * 404:
 * description: Reporte no encontrado
 */
router.delete('/:id', ctrl.remove);

module.exports = router;