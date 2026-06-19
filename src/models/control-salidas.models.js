/**
 * @module IngresoSalidaModel
 * @description
 * Clase que representa un registro de ingreso o salida de vehículos
 * dentro del sistema ParkU.
 * Sincronizada con la tabla 'ingreso_salida' de la base de datos.
 */

class IngresoSalida {

  /**
   * @param {number} id - Identificador único del registro
   * @param {string} tipo - Tipo de movimiento (INGRESO o SALIDA)
   * @param {number} vehiculo - ID del vehículo
   * @param {number} celda - ID de la celda
   * @param {string|null} descripcion - Observaciones o descripción
   * @param {Date|string} fecha_hora - Fecha y hora del movimiento
   */
  constructor(
    id,
    tipo,
    vehiculo,
    celda,
    descripcion,
    fecha_hora
  ) {

    /** @type {number} */
    this.id = id;

    /**
     * INGRESO | SALIDA
     * @type {string}
     */
    this.tipo = tipo;

    /**
     * Referencia a vehiculo.id
     * @type {number}
     */
    this.vehiculo = vehiculo;

    /**
     * Referencia a celda.id
     * @type {number}
     */
    this.celda = celda;

    /**
     * Observaciones del movimiento
     * @type {string|null}
     */
    this.descripcion = descripcion;

    /**
     * Fecha y hora del movimiento
     * @type {Date|string}
     */
    this.fecha_hora = fecha_hora;
  }
}

module.exports = IngresoSalida;