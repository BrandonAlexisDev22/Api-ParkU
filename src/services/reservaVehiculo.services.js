const reservaVehiculoRepository = require('../repositories/reservaVehiculoRepository');


/**
 * Obtiene todas las reservas de vehículos.
 * 
 * @returns {Array<Object>} Lista de reservas registradas.
 */
const listarReservas = () => {
  return reservaVehiculoRepository.listar();
};


/**
 * Consulta una reserva por su ID.
 * 
 * @param {number} id - ID de la reserva.
 * @returns {Object|undefined} Reserva encontrada o undefined si no existe.
 */
const consultarReserva = (id) => {
  return reservaVehiculoRepository.consultar(id);
};


/**
 * Visualiza el detalle de una reserva.
 * 
 * @param {number} id - ID de la reserva.
 * @returns {Object|undefined} Reserva encontrada o undefined si no existe.
 */
const visualizarReserva = (id) => {
  return reservaVehiculoRepository.visualizar(id);
};


/**
 * Crea una nueva reserva de vehículo.
 * 
 * @param {Object} reservaData - Datos de la reserva.
 * @returns {Object} Nueva reserva creada.
 */
const crearReserva = (reservaData) => {
  return reservaVehiculoRepository.create(reservaData);
};


/**
 * Edita una reserva existente.
 * 
 * @param {number} id - ID de la reserva.
 * @param {Object} reservaData - Nuevos datos de la reserva.
 * @returns {Object|null} Reserva actualizada o null si no se encuentra.
 */
const editarReserva = (id, reservaData) => {
  return reservaVehiculoRepository.editar(id, reservaData);
};


/**
 * Genera un reporte de las reservas registradas.
 * 
 * @returns {Array<Object>} Lista de reservas para reporte.
 */
const generarReporteReservas = () => {
  return reservaVehiculoRepository.generarReporte();
};


module.exports = {
  listarReservas,
  consultarReserva,
  visualizarReserva,
  crearReserva,
  editarReserva,
  generarReporteReservas
};