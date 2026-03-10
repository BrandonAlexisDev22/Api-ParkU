/**
 * @module novedadModel
 * @description
 * Modelo que representa una novedad registrada dentro del sistema
 * de gestión de parqueaderos.
 *
 * Una novedad permite registrar situaciones o eventos que ocurren
 * dentro del parqueadero, tales como:
 * - Vehículo mal estacionado
 * - Daños en una celda
 * - Problemas de seguridad
 * - Bloqueo de espacios
 * - Reportes administrativos
 */

/**
 * Representa una Novedad dentro del sistema
 *
 * @class Novedad
 */
class Novedad {

  /**
   * Crea una nueva instancia de Novedad
   *
   * @constructor
   *
   * @param {number} id - Identificador único de la novedad
   * @param {string} tipo - Tipo de novedad registrada
   * @param {string} descripcion - Descripción detallada de la novedad
   * @param {number} id_celda - Celda relacionada con la novedad
   * @param {string} reportado_por - Usuario o guardia que reporta la novedad
   * @param {string} estado - Estado de la novedad (pendiente, en_proceso, resuelto)
   * @param {Date} fecha - Fecha y hora de registro
   */
  constructor(
    id,
    tipo,
    descripcion,
    id_celda,
    reportado_por,
    estado = "pendiente",
    fecha = new Date()
  ) {

    /**
     * Identificador de la novedad
     * @type {number}
     */
    this.id_novedad = id;

    /**
     * Tipo de novedad
     * @type {string}
     */
    this.tipo = tipo;

    /**
     * Descripción detallada de la novedad
     * @type {string}
     */
    this.descripcion = descripcion;

    /**
     * ID de la celda relacionada
     * @type {number}
     */
    this.id_celda = id_celda;

    /**
     * Usuario que reportó la novedad
     * @type {string}
     */
    this.reportado_por = reportado_por;

    /**
     * Estado actual de la novedad
     * pendiente | en_proceso | resuelto
     * @type {string}
     */
    this.estado = estado;

    /**
     * Fecha de registro de la novedad
     * @type {Date}
     */
    this.fecha = fecha;
  }
}

module.exports = Novedad;