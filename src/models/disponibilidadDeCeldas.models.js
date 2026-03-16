/**
 * Clase que representa la disponibilidad de una celda
 */
class DisponibilidadCelda {

  /**
   * Constructor de disponibilidad
   * 
   * @param {number} id_disponibilidad - ID del registro
   * @param {number} id_celda - ID de la celda
   * @param {string} estado - Estado de la celda (disponible, ocupada, reservada)
   * @param {string} fecha_actualizacion - Fecha de actualización
   * @param {string} hora_actualizacion - Hora de actualización
   */
  constructor(
    id_disponibilidad,
    id_celda,
    estado,
    fecha_actualizacion,
    hora_actualizacion
  ) {

    this.id_disponibilidad = id_disponibilidad;
    this.id_celda = id_celda;
    this.estado = estado;
    this.fecha_actualizacion = fecha_actualizacion;
    this.hora_actualizacion = hora_actualizacion;

  }
}

module.exports = DisponibilidadCelda;