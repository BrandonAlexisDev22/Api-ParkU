/**
 * @module ReservaService
 * @description Gestión de reservas de celdas. Incluye lógica de validación de fechas 
 * y control de solapamientos horarios para evitar conflictos.
 * Alineado con el modelo Reserva.
 */

const repo = require('../repositories/reserva.repository');
const celdaRepo = require('../repositories/celda.repository');
const vehRepo = require('../repositories/vehiculo.repository');

/**
 * @swagger
 * components:
 *   schemas:
 *     Reserva:
 *       type: object
 *       required:
 *         - celda
 *         - vehiculo
 *         - fechaHora_inicio
 *         - fechaHora_fin
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la reserva.
 *         celda:
 *           type: integer
 *           description: ID de la celda a reservar.
 *         vehiculo:
 *           type: integer
 *           description: ID del vehículo que reserva.
 *         fechaHora_inicio:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de inicio de la reserva.
 *         fechaHora_fin:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de finalización de la reserva.
 *         estado:
 *           type: integer
 *           enum: [0, 1]
 *           description: Estado (1=activa, 0=finalizada/cancelada).
 *     ReservaCreate:
 *       type: object
 *       required:
 *         - celda
 *         - vehiculo
 *         - fechaHora_inicio
 *         - fechaHora_fin
 *       properties:
 *         celda:
 *           type: integer
 *         vehiculo:
 *           type: integer
 *         fechaHora_inicio:
 *           type: string
 *           format: date-time
 *         fechaHora_fin:
 *           type: string
 *           format: date-time
 *         estado:
 *           type: integer
 *           default: 1
 *     ReservaUpdate:
 *       type: object
 *       properties:
 *         celda:
 *           type: integer
 *         vehiculo:
 *           type: integer
 *         fechaHora_inicio:
 *           type: string
 *           format: date-time
 *         fechaHora_fin:
 *           type: string
 *           format: date-time
 *         estado:
 *           type: integer
 *           enum: [0, 1]
 */

/**
 * Obtiene el listado de todas las reservas.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca una reserva por su ID.
 * @param {number} id 
 * @throws {Object} 404 si la reserva no existe.
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Reserva no encontrada' };
  return item;
};

/**
 * Filtra reservas por vehículo.
 * @param {number} vehiculoId 
 * @returns {Promise<Array>}
 */
const getByVehiculo = (vehiculoId) => repo.findByVehiculo(vehiculoId);

/**
 * Filtra reservas por celda.
 * @param {number} celdaId 
 * @returns {Promise<Array>}
 */
const getByCelda = (celdaId) => repo.findByCelda(celdaId);

/**
 * Valida la coherencia de las fechas de reserva.
 * @private
 * @param {string} inicio 
 * @param {string} fin 
 * @throws {Object} 400 si las fechas son inválidas, pasadas o el inicio es mayor al fin.
 */
const _validarFechas = (inicio, fin) => {
  const i = new Date(inicio);
  const f = new Date(fin);
  if (isNaN(i) || isNaN(f)) throw { status: 400, message: 'Fechas inválidas' };
  if (i >= f) throw { status: 400, message: 'fechaHora_inicio debe ser anterior a fechaHora_fin' };
  const now = new Date();
  // Permitir reservas para hoy si la hora de inicio es futura (comparar solo fecha si es hoy)
  if (i < now && i.toDateString() === now.toDateString()) {
    // Si es hoy y la hora ya pasó, se rechaza
    if (i < now) throw { status: 400, message: 'No se puede reservar en una hora pasada de hoy' };
  } else if (i < now) {
    throw { status: 400, message: 'No se puede reservar en una fecha pasada' };
  }
};

/**
 * Valida que una celda y vehículo existan (si se proporcionan).
 * @private
 */
const _validarEntidades = async (celdaId, vehiculoId) => {
  if (celdaId !== undefined) {
    const celda = await celdaRepo.findById(celdaId);
    if (!celda) throw { status: 404, message: 'Celda no encontrada' };
  }
  if (vehiculoId !== undefined) {
    const vehiculo = await vehRepo.findById(vehiculoId);
    if (!vehiculo) throw { status: 404, message: 'Vehículo no encontrado' };
  }
};

/**
 * Crea una reserva verificando disponibilidad horaria.
 * @param {Object} data - { celda, vehiculo, fechaHora_inicio, fechaHora_fin, estado? }
 * @throws {Object} 400 Datos faltantes, 404 Entidades no encontradas, 409 Conflicto de horario.
 * @returns {Promise<Object>}
 */
const create = async ({ celda, vehiculo, fechaHora_inicio, fechaHora_fin, estado = 1 }) => {
  if (!celda || !vehiculo || !fechaHora_inicio || !fechaHora_fin) {
    throw { status: 400, message: 'celda, vehiculo, fechaHora_inicio y fechaHora_fin son requeridos' };
  }

  _validarFechas(fechaHora_inicio, fechaHora_fin);
  await _validarEntidades(celda, vehiculo);

  // Lógica de Solapamiento
  const conflictos = await repo.findConflictos(celda, fechaHora_inicio, fechaHora_fin);
  if (conflictos.length) {
    throw { status: 409, message: 'La celda ya tiene una reserva en ese horario' };
  }

  return repo.create({ celda, vehiculo, fechaHora_inicio, fechaHora_fin, estado });
};

/**
 * Actualiza una reserva existente validando nuevos conflictos.
 * @param {number} id 
 * @param {Object} datos - Campos a actualizar (todos opcionales).
 * @throws {Object} 404 si no existe, 400 si fechas inválidas, 409 si conflicto.
 * @returns {Promise<Object>}
 */
const update = async (id, datos) => {
  const reservaActual = await getById(id);

  // Si se cambia celda o vehículo, validar existencia
  if (datos.celda !== undefined || datos.vehiculo !== undefined) {
    await _validarEntidades(
      datos.celda !== undefined ? datos.celda : reservaActual.celda,
      datos.vehiculo !== undefined ? datos.vehiculo : reservaActual.vehiculo
    );
  }

  // Validar fechas si se envían
  const inicio = datos.fechaHora_inicio !== undefined ? datos.fechaHora_inicio : reservaActual.fechaHora_inicio;
  const fin = datos.fechaHora_fin !== undefined ? datos.fechaHora_fin : reservaActual.fechaHora_fin;
  if (datos.fechaHora_inicio !== undefined || datos.fechaHora_fin !== undefined) {
    _validarFechas(inicio, fin);
  }

  // Verificar conflictos de horario (usando la celda final)
  const celdaFinal = datos.celda !== undefined ? datos.celda : reservaActual.celda;
  const conflictos = await repo.findConflictos(celdaFinal, inicio, fin, id);
  if (conflictos.length) {
    throw { status: 409, message: 'La celda ya tiene una reserva en ese horario' };
  }

  // Actualizar solo los campos enviados
  return repo.update(id, datos);
};

/**
 * Elimina una reserva.
 * @param {number} id 
 * @throws {Object} 404 si no existe, 409 si no se puede eliminar (por integridad).
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  await getById(id);
  try {
    return await repo.remove(id);
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw { status: 409, message: 'No se puede eliminar porque está referenciado en otros registros' };
    }
    throw error;
  }
};

module.exports = {
  getAll,
  getById,
  getByVehiculo,
  getByCelda,
  create,
  update,
  remove,
};