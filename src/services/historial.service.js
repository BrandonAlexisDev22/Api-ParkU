/**
 * @module HistorialService
 * @description Lectura de historiales (celda, parqueadero, reserva, novedad). Sin
 * lógica de negocio: las tablas se llenan solas vía trigger.
 */

const repo = require('../repositories/historial.repository');

const getByCelda = (celdaId) => repo.findByCelda(celdaId);
const getByParqueadero = (parqueaderoId) => repo.findByParqueadero(parqueaderoId);
const getByReserva = (reservaId) => repo.findByReserva(reservaId);
const getByNovedad = (novedadId) => repo.findByNovedad(novedadId);

module.exports = { getByCelda, getByParqueadero, getByReserva, getByNovedad };
