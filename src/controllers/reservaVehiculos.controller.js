const reservaVehiculoService = require('../services/reservaVehiculoService');


/**
 * Lista todas las reservas de vehículos
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const listarReservas = (req, res) => {

  const reservas = reservaVehiculoService.listarReservas();

  res.json(reservas);

};


/**
 * Consulta una reserva por su ID
 * 
 * @param {Object} req
 * @param {Object} res
 */
const consultarReserva = (req, res) => {

  const id = parseInt(req.params.id);

  const reserva = reservaVehiculoService.consultarReserva(id);

  if (!reserva) {
    return res.status(404).json({ mensaje: "Reserva no encontrada" });
  }

  res.json(reserva);

};


/**
 * Visualiza el detalle de una reserva
 * 
 * @param {Object} req
 * @param {Object} res
 */
const visualizarReserva = (req, res) => {

  const id = parseInt(req.params.id);

  const reserva = reservaVehiculoService.visualizarReserva(id);

  if (!reserva) {
    return res.status(404).json({ mensaje: "Reserva no encontrada" });
  }

  res.json(reserva);

};


/**
 * Crea una nueva reserva de vehículo
 * 
 * @param {Object} req
 * @param {Object} res
 */
const crearReserva = (req, res) => {

  const nuevaReserva = reservaVehiculoService.crearReserva(req.body);

  res.status(201).json(nuevaReserva);

};


/**
 * Edita una reserva existente
 * 
 * @param {Object} req
 * @param {Object} res
 */
const editarReserva = (req, res) => {

  const id = parseInt(req.params.id);

  const reservaActualizada = reservaVehiculoService.editarReserva(id, req.body);

  if (!reservaActualizada) {
    return res.status(404).json({ mensaje: "Reserva no encontrada" });
  }

  res.json(reservaActualizada);

};


/**
 * Genera un reporte de reservas
 * 
 * @param {Object} req
 * @param {Object} res
 */
const generarReporteReservas = (req, res) => {

  const reporte = reservaVehiculoService.generarReporteReservas();

  res.json(reporte);

};


module.exports = {
  listarReservas,
  consultarReserva,
  visualizarReserva,
  crearReserva,
  editarReserva,
  generarReporteReservas
};