/**
 * @module ReservaService
 * @description Gestión de reservas de celdas. Incluye lógica de validación de fechas 
 * y control de solapamientos horarios para evitar conflictos.
 */

const repo      = require('../repositories/reserva.repository');
const celdaRepo = require('../repositories/celda.repository');
const vehRepo   = require('../repositories/vehiculo.repository');

/**
 * @swagger
 * components:
 * schemas:
 * Reserva:
 * type: object
 * required:
 * - celda
 * - vehiculo
 * - fechaHora_inicio
 * - fechaHora_fin
 * properties:
 * id:
 * type: integer
 * description: ID único de la reserva.
 * celda:
 * type: integer
 * description: ID de la celda a reservar.
 * vehiculo:
 * type: integer
 * description: ID del vehículo que reserva.
 * fechaHora_inicio:
 * type: string
 * format: date-time
 * description: Fecha y hora de inicio de la reserva.
 * fechaHora_fin:
 * type: string
 * format: date-time
 * description: Fecha y hora de finalización de la reserva.
 * estado:
 * type: string
 * description: Estado actual (ej. activa, cancelada, completada).
 * example:
 * celda: 10
 * vehiculo: 5
 * fechaHora_inicio: "2026-03-20T08:00:00Z"
 * fechaHora_fin: "2026-03-20T10:00:00Z"
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
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Reserva no encontrada' };
  return item;
};

/**
 * Filtra reservas por vehículo.
 * @param {number} vehiculoId 
 */
const getByVehiculo = (vehiculoId) => repo.findByVehiculo(vehiculoId);

/**
 * Filtra reservas por celda.
 * @param {number} celdaId 
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
  if (i < new Date()) throw { status: 400, message: 'No se puede reservar en una fecha pasada' };
};

/**
 * Crea una reserva verificando disponibilidad horaria.
 * @param {Object} data - { celda, vehiculo, fechaHora_inicio, fechaHora_fin }
 * @throws {Object} 400 Datos faltantes, 404 Entidades no encontradas, 409 Conflicto de horario.
 */
const create = async ({ celda, vehiculo, fechaHora_inicio, fechaHora_fin }) => {
  if (!celda || !vehiculo || !fechaHora_inicio || !fechaHora_fin)
    throw { status: 400, message: 'celda, vehiculo, fechaHora_inicio y fechaHora_fin son requeridos' };

  _validarFechas(fechaHora_inicio, fechaHora_fin);

  const celdaExiste = await celdaRepo.findById(celda);
  if (!celdaExiste) throw { status: 404, message: 'Celda no encontrada' };

  const vehExiste = await vehRepo.findById(vehiculo);
  if (!vehExiste) throw { status: 404, message: 'Vehículo no encontrado' };

  // Lógica de Solapamiento
  const conflictos = await repo.findConflictos(celda, fechaHora_inicio, fechaHora_fin);
  if (conflictos.length) throw { status: 409, message: 'La celda ya tiene una reserva en ese horario' };

  return repo.create({ celda, vehiculo, fechaHora_inicio, fechaHora_fin });
};

/**
 * Actualiza una reserva existente validando nuevos conflictos.
 * @param {number} id 
 * @param {Object} datos 
 */
const update = async (id, datos) => {
  const reserva = await getById(id);
  _validarFechas(datos.fechaHora_inicio, datos.fechaHora_fin);

  const conflictos = await repo.findConflictos(
    datos.celda || reserva.celda_id,
    datos.fechaHora_inicio,
    datos.fechaHora_fin,
    id
  );
  if (conflictos.length) throw { status: 409, message: 'La celda ya tiene una reserva en ese horario' };

  return repo.update(id, datos);
};

/**
 * Elimina una reserva.
 * @param {number} id 
 */
const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, getByVehiculo, getByCelda, create, update, remove };