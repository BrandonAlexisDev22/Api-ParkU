/**
 * @swagger
 * tags:
 *   name: Reservas
 *   description: Endpoints para gestionar reservas de celdas y vehículos
 */

const svc = require('../services/reserva.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     Reserva:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la reserva.
 *         tipo_reserva:
 *           type: string
 *           enum: [VEHICULO_SENA, MOVILIDAD_REDUCIDA, VISITANTE]
 *         celda_id:
 *           type: integer
 *           description: ID de la celda a reservar.
 *         usuario_registra_id:
 *           type: integer
 *           description: Vigilante o administrador que registró la reserva.
 *         conductor_id:
 *           type: integer
 *           nullable: true
 *           description: Persona para quien es la reserva.
 *         vehiculo_id:
 *           type: integer
 *           nullable: true
 *         motivo:
 *           type: string
 *           nullable: true
 *         fecha_hora_inicio:
 *           type: string
 *           format: date-time
 *         fecha_hora_fin:
 *           type: string
 *           format: date-time
 *         estado:
 *           type: string
 *           enum: [PENDIENTE, ACEPTADA, RECHAZADA, TERMINADA, CANCELADA]
 *         usuario_gestiona_id:
 *           type: integer
 *           nullable: true
 *           description: Quién aceptó/rechazó la reserva. Vacío mientras siga PENDIENTE.
 *         motivo_rechazo:
 *           type: string
 *           nullable: true
 *           description: Obligatorio cuando estado es RECHAZADA.
 *     ReservaCreate:
 *       type: object
 *       required:
 *         - tipo_reserva
 *         - celda_id
 *         - fecha_hora_inicio
 *         - fecha_hora_fin
 *       properties:
 *         tipo_reserva:
 *           type: string
 *           enum: [VEHICULO_SENA, MOVILIDAD_REDUCIDA, VISITANTE]
 *         celda_id:
 *           type: integer
 *         conductor_id:
 *           type: integer
 *           nullable: true
 *         vehiculo_id:
 *           type: integer
 *           nullable: true
 *         motivo:
 *           type: string
 *           nullable: true
 *         fecha_hora_inicio:
 *           type: string
 *           format: date-time
 *         fecha_hora_fin:
 *           type: string
 *           format: date-time
 *     ReservaUpdate:
 *       type: object
 *       properties:
 *         tipo_reserva:
 *           type: string
 *           enum: [VEHICULO_SENA, MOVILIDAD_REDUCIDA, VISITANTE]
 *         celda_id:
 *           type: integer
 *         conductor_id:
 *           type: integer
 *           nullable: true
 *         vehiculo_id:
 *           type: integer
 *           nullable: true
 *         motivo:
 *           type: string
 *           nullable: true
 *         fecha_hora_inicio:
 *           type: string
 *           format: date-time
 *         fecha_hora_fin:
 *           type: string
 *           format: date-time
 *     ReservaCambiarEstado:
 *       type: object
 *       required:
 *         - estado
 *       properties:
 *         estado:
 *           type: string
 *           enum: [ACEPTADA, RECHAZADA, TERMINADA, CANCELADA]
 *         motivoRechazo:
 *           type: string
 *           description: Obligatorio cuando estado es RECHAZADA.
 */

/**
 * @swagger
 * /reservas:
 *   get:
 *     summary: Obtener todas las reservas
 *     tags: [Reservas]
 *     responses:
 *       200:
 *         description: Lista de todas las reservas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reserva'
 */
const getAll = async (req, res) => {
  try {
    const data = await svc.getAll(req.usuario?.id);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /reservas/{id}:
 *   get:
 *     summary: Obtener una reserva por ID
 *     tags: [Reservas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reserva
 *     responses:
 *       200:
 *         description: Reserva encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reserva'
 *       404:
 *         description: Reserva no encontrada
 */
const getById = async (req, res) => {
  try {
    const data = await svc.getById(req.params.id);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /reservas/vehiculo/{vehiculoId}:
 *   get:
 *     summary: Obtener reservas por vehículo
 *     tags: [Reservas]
 *     parameters:
 *       - in: path
 *         name: vehiculoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     responses:
 *       200:
 *         description: Lista de reservas del vehículo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reserva'
 */
const getByVehiculo = async (req, res) => {
  try {
    const data = await svc.getByVehiculo(req.params.vehiculoId);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /reservas/celda/{celdaId}:
 *   get:
 *     summary: Obtener reservas por celda
 *     tags: [Reservas]
 *     parameters:
 *       - in: path
 *         name: celdaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la celda
 *     responses:
 *       200:
 *         description: Lista de reservas de la celda
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reserva'
 */
const getByCelda = async (req, res) => {
  try {
    const data = await svc.getByCelda(req.params.celdaId);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /reservas:
 *   post:
 *     summary: Crear una nueva reserva
 *     tags: [Reservas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReservaCreate'
 *     responses:
 *       201:
 *         description: Reserva creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reserva'
 *       400:
 *         description: Datos inválidos o fechas incorrectas
 *       404:
 *         description: Celda o vehículo no encontrado
 *       409:
 *         description: Conflicto de horario - la celda ya está reservada
 */
const create = async (req, res) => {
  try {
    const newReserva = await svc.create(req.body, req.usuario?.id, req.usuario?.rol);
    res.status(201).json(newReserva);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /reservas/{id}:
 *   put:
 *     summary: Actualizar una reserva (parcial o total)
 *     tags: [Reservas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReservaUpdate'
 *     responses:
 *       200:
 *         description: Reserva actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reserva'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Reserva no encontrada
 *       409:
 *         description: Conflicto de horario con otra reserva
 */
const update = async (req, res) => {
  try {
    const updated = await svc.update(req.params.id, req.body, req.usuario?.id);
    res.json(updated);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /reservas/{id}/estado:
 *   patch:
 *     summary: Acepta, rechaza, cancela o termina una reserva
 *     description: La celda pasa a RESERVADA al aceptar, y se libera al cancelar/rechazar/terminar (lo hace la BD automáticamente).
 *     tags: [Reservas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReservaCambiarEstado'
 *     responses:
 *       200:
 *         description: Reserva actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reserva'
 *       400:
 *         description: Estado inválido
 *       404:
 *         description: Reserva no encontrada
 */
const cambiarEstado = async (req, res) => {
  try {
    // El motivo llega como motivo_rechazo (el nombre de la columna, que es el que manda el
    // frontend) o como motivoRechazo. Aceptando solo el segundo, rechazar una reserva desde
    // la aplicación respondía siempre 400 "El motivo de rechazo es obligatorio".
    const motivoRechazo = req.body.motivo_rechazo ?? req.body.motivoRechazo;
    const updated = await svc.cambiarEstado(req.params.id, req.body.estado, req.usuario?.id, motivoRechazo);
    res.json(updated);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /reservas/{id}/cancelar:
 *   patch:
 *     summary: Cancelar una reserva propia
 *     description: >
 *       Para quien la pidió. Un Admin o Vigilante puede cancelar cualquiera; los demás
 *       roles, solo las suyas. Aceptar o rechazar sigue siendo PATCH /{id}/estado.
 *     tags: [Reservas]
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
 *         description: Reserva cancelada
 *       403:
 *         description: La reserva no es suya
 *       404:
 *         description: Reserva no encontrada
 *       409:
 *         description: La reserva ya no se puede cancelar
 */
const cancelar = async (req, res) => {
  try {
    const motivo = req.body?.motivo_rechazo ?? req.body?.motivoRechazo ?? req.body?.motivo;
    const actualizada = await svc.cancelar(req.params.id, req.usuario?.id, req.usuario?.rol, motivo);
    res.json(actualizada);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /reservas/{id}:
 *   delete:
 *     summary: Eliminar una reserva por ID
 *     tags: [Reservas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reserva
 *     responses:
 *       204:
 *         description: Reserva eliminada correctamente
 *       404:
 *         description: Reserva no encontrada
 *       409:
 *         description: No se puede eliminar porque está referenciada
 */
const remove = async (req, res) => {
  try {
    await svc.remove(req.params.id, req.usuario?.id);
    res.status(204).send();
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = {
  getAll,
  getById,
  getByVehiculo,
  getByCelda,
  create,
  update,
  cambiarEstado,
  cancelar,
  remove,
};
