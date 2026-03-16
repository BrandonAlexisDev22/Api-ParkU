const router = require('express').Router();
const ctrl   = require('../controllers/entradaSalida.controller');

/**
 * @swagger
 * tags:
 * name: Control de Acceso
 * description: Registro y monitoreo de movimientos (Entradas y Salidas)
 */

/**
 * @swagger
 * /api/entradas-salidas:
 * get:
 * summary: Obtiene todo el historial de movimientos
 * tags: [Control de Acceso]
 * responses:
 * 200:
 * description: Historial completo obtenido
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/EntradaSalida'
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/entradas-salidas/filtro:
 * get:
 * summary: Filtra movimientos por rango de fechas
 * tags: [Control de Acceso]
 * parameters:
 * - in: query
 * name: desde
 * required: true
 * schema:
 * type: string
 * format: date
 * description: Fecha inicial (YYYY-MM-DD)
 * - in: query
 * name: hasta
 * required: true
 * schema:
 * type: string
 * format: date
 * description: Fecha final (YYYY-MM-DD)
 * responses:
 * 200:
 * description: Registros encontrados en el rango
 * 400:
 * description: Faltan parámetros de fecha
 */
router.get('/filtro', ctrl.getByFecha);

/**
 * @swagger
 * /api/entradas-salidas/vehiculo/{vehiculoId}:
 * get:
 * summary: Historial de movimientos de un vehículo específico
 * tags: [Control de Acceso]
 * parameters:
 * - in: path
 * name: vehiculoId
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Lista de movimientos del vehículo
 */
router.get('/vehiculo/:vehiculoId', ctrl.getByVehiculo);

/**
 * @swagger
 * /api/entradas-salidas/{id}:
 * get:
 * summary: Obtiene un registro específico por ID
 * tags: [Control de Acceso]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Datos del registro
 * 404:
 * description: Registro no encontrado
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/entradas-salidas/entrada:
 * post:
 * summary: Registra el ingreso de un vehículo
 * description: Registra la entrada y cambia automáticamente el estado de la celda a ocupada (0).
 * tags: [Control de Acceso]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - celda
 * - vehiculo
 * properties:
 * celda:
 * type: integer
 * vehiculo:
 * type: integer
 * descripcion:
 * type: string
 * responses:
 * 201:
 * description: Entrada registrada con éxito
 * 409:
 * description: Conflicto - La celda ya está ocupada
 */
router.post('/entrada', ctrl.registrarEntrada);

/**
 * @swagger
 * /api/entradas-salidas/salida:
 * post:
 * summary: Registra la salida de un vehículo
 * description: Registra la salida y libera la celda cambiándola a disponible (1).
 * tags: [Control de Acceso]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - celda
 * - vehiculo
 * properties:
 * celda:
 * type: integer
 * vehiculo:
 * type: integer
 * descripcion:
 * type: string
 * responses:
 * 201:
 * description: Salida registrada con éxito
 */
router.post('/salida', ctrl.registrarSalida);

/**
 * @swagger
 * /api/entradas-salidas/{id}:
 * delete:
 * summary: Elimina un registro del historial
 * tags: [Control de Acceso]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Registro eliminado
 */
router.delete('/:id', ctrl.remove);

module.exports = router;