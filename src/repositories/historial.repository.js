/**
 * @module HistorialRepository
 * @description Lectura de las 4 tablas de historial que la BD llena sola vía trigger en
 * cada INSERT/UPDATE de celda, parqueadero, reserva y novedad (fn_historial_celda,
 * fn_historial_parqueadero, fn_historial_reserva, fn_historial_novedad). Solo lectura.
 */

const {
  HistorialCelda, HistorialParqueadero, HistorialReserva, HistorialNovedad, Usuario,
} = require('../models');

const includeUsuario = { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] };

/**
 * @param {number} celdaId
 * @returns {Promise<Array>}
 */
const findByCelda = async (celdaId) => {
  const rows = await HistorialCelda.findAll({
    where: { celda_id: celdaId },
    include: [includeUsuario],
    order: [['fecha_hora', 'DESC']],
  });
  return rows.map((r) => r.toJSON());
};

/**
 * @param {number} parqueaderoId
 * @returns {Promise<Array>}
 */
const findByParqueadero = async (parqueaderoId) => {
  const rows = await HistorialParqueadero.findAll({
    where: { parqueadero_id: parqueaderoId },
    include: [includeUsuario],
    order: [['fecha_hora', 'DESC']],
  });
  return rows.map((r) => r.toJSON());
};

/**
 * @param {number} reservaId
 * @returns {Promise<Array>}
 */
const findByReserva = async (reservaId) => {
  const rows = await HistorialReserva.findAll({
    where: { reserva_id: reservaId },
    include: [includeUsuario],
    order: [['fecha_hora', 'DESC']],
  });
  return rows.map((r) => r.toJSON());
};

/**
 * @param {number} novedadId
 * @returns {Promise<Array>}
 */
const findByNovedad = async (novedadId) => {
  const rows = await HistorialNovedad.findAll({
    where: { novedad_id: novedadId },
    include: [includeUsuario],
    order: [['fecha_hora', 'DESC']],
  });
  return rows.map((r) => r.toJSON());
};

module.exports = { findByCelda, findByParqueadero, findByReserva, findByNovedad };
