/**
 * @module HistorialService
 * @description Lectura de historiales (celda, parqueadero, reserva, novedad). Sin
 * lógica de negocio: las tablas se llenan solas vía trigger.
 */

const repo = require('../repositories/historial.repository');
const reservaSvc = require('./reserva.service');
const novedadesSvc = require('./novedades.service');

// Celdas y parqueaderos son infraestructura compartida: su historial lo ve cualquiera
// con sesión. El de una reserva o una novedad es de quien puede ver esa reserva o
// novedad (gestor, o su dueño) -- mismo criterio que reserva.service / novedades.service.
const getByCelda = (celdaId) => repo.findByCelda(celdaId);
const getByParqueadero = (parqueaderoId) => repo.findByParqueadero(parqueaderoId);
const getByReserva = async (reservaId, solicitante) => {
  await reservaSvc.getById(reservaId, solicitante);
  return repo.findByReserva(reservaId);
};
const getByNovedad = async (novedadId, solicitante) => {
  await novedadesSvc.exigirNovedadAccesible(novedadId, solicitante);
  return repo.findByNovedad(novedadId);
};

module.exports = { getByCelda, getByParqueadero, getByReserva, getByNovedad };
