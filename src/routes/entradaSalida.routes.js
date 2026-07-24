const router = require('express').Router();
const ctrl = require('../controllers/entradaSalida.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Control de Acceso
 *   description: Registro y monitoreo de movimientos (Entradas y Salidas)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EntradaSalida:
 *       type: object
 *       required:
 *         - tipo
 *         - vehiculo
 *         - celda
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental del registro.
 *         tipo:
 *           type: string
 *           enum: [INGRESO, SALIDA]
 *           description: Tipo de movimiento.
 *         vehiculo:
 *           type: integer
 *           description: ID del vehículo.
 *         celda:
 *           type: integer
 *           description: ID de la celda utilizada.
 *         descripcion:
 *           type: string
 *           nullable: true
 *           description: Observaciones opcionales.
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del movimiento.
 *         parqueadero_nombre:
 *           type: string
 *           description: Nombre del parqueadero (solo en respuestas con JOIN).
 *         vehiculo_placa:
 *           type: string
 *           description: Placa del vehículo (solo en respuestas con JOIN).
 *     EntradaSalidaCreate:
 *       type: object
 *       required:
 *         - vehiculo
 *         - celda
 *       properties:
 *         vehiculo:
 *           type: integer
 *         celda:
 *           type: integer
 *         descripcion:
 *           type: string
 *           nullable: true
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *           description: Opcional, si no se envía se usa la actual.
 */

/**
 * @swagger
 * /api/entradas-salidas:
 *   get:
 *     summary: Obtiene todo el historial de movimientos
 *     tags: [Control de Acceso]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Historial completo obtenido
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EntradaSalida'
 *       401:
 *         description: No autorizado - Token requerido
 */
router.get('/',
  verificarToken,
  verificarRol([1, 2]), // Admin (1) o Supervisor (2)
  ctrl.getAll
);

/**
 * @swagger
 * /api/entradas-salidas/filtro:
 *   get:
 *     summary: Filtra movimientos por rango de fechas
 *     tags: [Control de Acceso]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: desde
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial (YYYY-MM-DD)
 *       - in: query
 *         name: hasta
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Registros encontrados en el rango
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EntradaSalida'
 *       400:
 *         description: Faltan parámetros de fecha
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 */
router.get('/filtro',
  verificarToken,
  verificarRol([1, 2]), // Admin (1) o Supervisor (2)
  ctrl.getByFecha
);

/**
 * @swagger
 * /api/entradas-salidas/vehiculo/{vehiculoId}:
 *   get:
 *     summary: Historial de movimientos de un vehículo específico
 *     tags: [Control de Acceso]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehiculoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     responses:
 *       200:
 *         description: Lista de movimientos del vehículo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EntradaSalida'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 */
router.get('/vehiculo/:vehiculoId',
  verificarToken,
  verificarRol([1, 2]), // Admin (1) o Supervisor (2)
  ctrl.getByVehiculo
);

/**
 * @swagger
 * /api/entradas-salidas/{id}:
 *   get:
 *     summary: Obtiene un registro específico por ID
 *     tags: [Control de Acceso]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro
 *     responses:
 *       200:
 *         description: Datos del registro
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EntradaSalida'
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       404:
 *         description: Registro no encontrado
 */
router.get('/:id',
  verificarToken,
  verificarRol([1, 2]), // Admin (1) o Supervisor (2)
  ctrl.getById
);

/**
 * @swagger
 * /api/entradas-salidas/entrada:
 *   post:
 *     summary: Registra el ingreso de un vehículo
 *     description: Registra la entrada y cambia automáticamente el estado de la celda a OCUPADO
 *     tags: [Control de Acceso]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EntradaSalidaCreate'
 *     responses:
 *       201:
 *         description: Entrada registrada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EntradaSalida'
 *       400:
 *         description: Datos inválidos o faltantes
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       404:
 *         description: Vehículo o celda no encontrados
 *       409:
 *         description: Conflicto - La celda ya está ocupada o el vehículo ya tiene una entrada activa
 */
router.post('/entrada',
  verificarToken,
  verificarRol([1, 2]), // Admin (1) o Supervisor (2)
  ctrl.registrarEntrada
);

/**
 * @swagger
 * /api/entradas-salidas/salida:
 *   post:
 *     summary: Registra la salida de un vehículo
 *     description: Registra la salida y libera la celda cambiándola a DISPONIBLE
 *     tags: [Control de Acceso]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EntradaSalidaCreate'
 *     responses:
 *       201:
 *         description: Salida registrada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EntradaSalida'
 *       400:
 *         description: Datos inválidos o faltantes
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - No tienes permisos
 *       404:
 *         description: Vehículo o celda no encontrados
 *       409:
 *         description: Conflicto - El vehículo no tiene una entrada activa
 */
router.post('/salida',
  verificarToken,
  verificarRol([1, 2]), // Admin (1) o Supervisor (2)
  ctrl.registrarSalida
);

/**
 * @swagger
 * /api/entradas-salidas/{id}:
 *   delete:
 *     summary: Elimina un registro del historial (uso administrativo)
 *     tags: [Control de Acceso]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro a eliminar
 *     responses:
 *       204:
 *         description: Registro eliminado correctamente
 *       401:
 *         description: No autorizado - Token requerido
 *       403:
 *         description: Prohibido - Solo administradores
 *       404:
 *         description: Registro no encontrado
 */
router.delete('/:id',
  verificarToken,
  verificarRol([1]), // Solo Admin (1)
  ctrl.remove
);

module.exports = router;