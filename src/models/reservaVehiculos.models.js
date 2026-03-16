/**
 * @module ReservaModel
 * @description
 * Clase que representa la entidad Reserva dentro del sistema ParkU.
 * Sincronizada con la tabla 'reserva' de la base de datos en Railway.
 */

class Reserva {
  /**
   * @param {number} id - Identificador único (id en SQL)
   * @param {number} celda - ID de la celda asociada (FK)
   * @param {number} vehiculo - ID del vehículo asociado (FK)
   * @param {string} fechaHora_inicio - Fecha y hora de inicio de la reserva
   * @param {string} fechaHora_fin - Fecha y hora de fin de la reserva
   * @param {number} [estado=1] - Estado (1: Pendiente/Activa, 0: Finalizada/Cancelada)
   */
  constructor(id, celda, vehiculo, fechaHora_inicio, fechaHora_fin, estado = 1) {
    
    /** @type {number} */
    this.id = id; // En SQL es 'id'

    /** @type {number} */
    this.celda = celda; // En SQL es 'celda'

    /** @type {number} */
    this.vehiculo = vehiculo; // En SQL es 'vehiculo'

    /** @type {string} */
    this.fechaHora_inicio = fechaHora_inicio; // DATETIME en SQL

    /** @type {string} */
    this.fechaHora_fin = fechaHora_fin; // DATETIME en SQL

    /** @type {number} */
    this.estado = estado; // TINYINT en SQL
  }
}

module.exports = Reserva;