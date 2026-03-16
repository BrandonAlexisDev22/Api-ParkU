/**
 * Clase que representa una reserva de celda para un vehículo
 */
class ReservaVehiculo {

  /**
   * Constructor de una reserva
   * 
   * @param {number} id_reserva - ID de la reserva
   * @param {number} id_vehiculo - ID del vehículo
   * @param {number} id_conductor - ID del conductor
   * @param {number} id_celda - ID de la celda reservada
   * @param {string} fecha_reserva - Fecha en que se realiza la reserva
   * @param {string} hora_reserva - Hora en que se realiza la reserva
   * @param {string} fecha_ingreso - Fecha prevista de ingreso
   * @param {string} hora_ingreso - Hora prevista de ingreso
   * @param {string} estado_reserva - Estado de la reserva (activa, cancelada, completada)
   */
  constructor(id_reserva,id_vehiculo,id_conductor,id_celda,fecha_reserva,hora_reserva,fecha_ingreso,hora_ingreso,estado_reserva
  ) {

    this.id_reserva = id_reserva;
    this.id_vehiculo = id_vehiculo;
    this.id_conductor = id_conductor;
    this.id_celda = id_celda;
    this.fecha_reserva = fecha_reserva;
    this.hora_reserva = hora_reserva;
    this.fecha_ingreso = fecha_ingreso;
    this.hora_ingreso = hora_ingreso;
    this.estado_reserva = estado_reserva;

  }
}

module.exports = ReservaVehiculo;