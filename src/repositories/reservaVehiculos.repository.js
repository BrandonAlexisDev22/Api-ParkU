/**
 * Arreglo que almacena todas las reservas de vehículos en memoria.
 * @type {Array<Object>}
 */
let reservasVehiculos = [];

/**
 * Contador para generar IDs únicos automáticamente.
 * @type {number}
 */
let idCounter = 1;


/**
 * Lista todas las reservas de vehículos registradas.
 * 
 * @returns {Array<Object>} Lista de reservas.
 */
const listar = () => reservasVehiculos;


/**
 * Consulta una reserva por su ID.
 * 
 * @param {number} id - ID de la reserva.
 * @returns {Object|undefined} Reserva encontrada o undefined si no existe.
 */
const consultar = (id) => reservasVehiculos.find(r => r.id_reserva === id);


/**
 * Visualiza una reserva específica por su ID.
 * (Se usa normalmente para ver el detalle de una reserva)
 * 
 * @param {number} id - ID de la reserva.
 * @returns {Object|undefined} Reserva encontrada o undefined si no existe.
 */
const visualizar = (id) => reservasVehiculos.find(r => r.id_reserva === id);


/**
 * Crea una nueva reserva de vehículo.
 * Genera automáticamente el ID de la reserva.
 * 
 * @param {Object} reservaData - Datos de la reserva.
 * @param {number} reservaData.id_vehiculo
 * @param {number} reservaData.id_conductor
 * @param {number} reservaData.id_celda
 * @param {string} reservaData.fecha_reserva
 * @param {string} reservaData.hora_reserva
 * @param {string} reservaData.fecha_ingreso
 * @param {string} reservaData.hora_ingreso
 * @param {string} reservaData.estado_reserva
 * 
 * @returns {Object} Nueva reserva creada.
 */
const create = (reservaData) => {

  const nuevaReserva = {id_reserva: idCounter++,...reservaData
  };

  reservasVehiculos.push(nuevaReserva);

  return nuevaReserva;
};


/**
 * Edita una reserva existente por su ID.
 * 
 * @param {number} id - ID de la reserva.
 * @param {Object} reservaData - Nuevos datos de la reserva.
 * 
 * @returns {Object|null} Reserva actualizada o null si no se encuentra.
 */
const editar = (id, reservaData) => {

  const reserva = reservasVehiculos.find(r => r.id_reserva === id);

  if (!reserva) {
    return null;
  }

  Object.assign(reserva, reservaData);

  return reserva;
};


/**
 * Genera un reporte de todas las reservas registradas.
 * 
 * @returns {Array<Object>} Lista completa de reservas para reportes.
 */
const generarReporte = () => reservasVehiculos;


module.exports = {
  listar,
  consultar,
  visualizar,
  create,
  editar,
  generarReporte
};