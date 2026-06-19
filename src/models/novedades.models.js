/**
 * @module NovedadModel
 * @description
 * Clase que representa una novedad dentro del sistema ParkU.
 * Sincronizada con la tabla 'novedades' de la base de datos.
 */

class Novedad {

  /**
   * @param {number} id - Identificador único de la novedad
   * @param {number|null} vehiculo - ID del vehículo relacionado
   * @param {string|null} encargado - Persona encargada que reporta la novedad
   * @param {string} descripcion - Descripción de la novedad
   * @param {string|null} evidencia - Ruta o URL de evidencia
   * @param {number|null} ingreso_salida - ID del movimiento relacionado
   * @param {Date|string} fecha_hora - Fecha y hora de registro
   * @param {string} tipo_novedad - Tipo de novedad
   * @param {string} prioridad - Prioridad de la novedad
   * @param {boolean} estado - Estado de la novedad
   */
  constructor(
    id,
    vehiculo,
    encargado,
    descripcion,
    evidencia,
    ingreso_salida,
    fecha_hora,
    tipo_novedad = "OTRO",
    prioridad = "MEDIA",
    estado = true
  ) {

    /** @type {number} */
    this.id = id;

    /** @type {number|null} */
    this.vehiculo = vehiculo;

    /** @type {string|null} */
    this.encargado = encargado;

    /** @type {string} */
    this.descripcion = descripcion;

    /** @type {string|null} */
    this.evidencia = evidencia;

    /**
     * Referencia a ingreso_salida.id
     * @type {number|null}
     */
    this.ingreso_salida = ingreso_salida;

    /** @type {Date|string} */
    this.fecha_hora = fecha_hora;

    /**
     * DAÑO | ACCIDENTE | MAL_ESTACIONAMIENTO | QUEJA | OTRO
     * @type {string}
     */
    this.tipo_novedad = tipo_novedad;

    /**
     * BAJA | MEDIA | ALTA | CRITICA
     * @type {string}
     */
    this.prioridad = prioridad;

    /**
     * TRUE = Pendiente
     * FALSE = Resuelta
     * @type {boolean}
     */
    this.estado = estado;
  }
}

module.exports = Novedad;