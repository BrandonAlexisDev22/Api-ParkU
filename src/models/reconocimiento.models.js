/**
 * @module reconocimientoModel
 * @description
 * Modelo que representa un registro de reconocimiento automático
 * de placas de vehículos dentro del sistema de parqueaderos.
 *
 * Este modelo se utiliza para almacenar las placas detectadas por
 * cámaras de reconocimiento instaladas en los accesos del parqueadero.
 */

/**
 * Representa un reconocimiento de placa
 *
 * @class Reconocimiento
 */
class Reconocimiento {

  /**
   * Crea una nueva instancia de reconocimiento de placa
   *
   * @constructor
   *
   * @param {number} id - Identificador único del reconocimiento
   * @param {string} placa - Placa del vehículo detectado
   * @param {string} camara - Nombre o ubicación de la cámara que detectó la placa
   * @param {number} confianza - Nivel de confianza del reconocimiento (0 a 1)
   * @param {Date} fecha_hora - Fecha y hora en que se detectó la placa
   */
  constructor(id, placa, camara, confianza, fecha_hora = new Date()) {

    /**
     * ID del reconocimiento
     * @type {number}
     */
    this.id_reconocimiento = id;

    /**
     * Placa detectada
     * @type {string}
     */
    this.placa = placa;

    /**
     * Cámara que realizó el reconocimiento
     * @type {string}
     */
    this.camara = camara;

    /**
     * Nivel de confianza del reconocimiento
     * Valor entre 0 y 1
     * @type {number}
     */
    this.confianza = confianza;

    /**
     * Fecha y hora del reconocimiento
     * @type {Date}
     */
    this.fecha_hora = fecha_hora;
  }
}

module.exports = Reconocimiento;