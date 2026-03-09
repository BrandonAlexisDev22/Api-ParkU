/**
 * @module celdaModel
 * @description
 * Modelo que representa una celda dentro de un parqueadero.
 *
 * Una celda es un espacio individual donde puede estacionarse
 * un vehículo dentro de un parqueadero.
 *
 * Este modelo define la estructura de los datos utilizados
 * en el sistema para gestionar las celdas.
 */

class Celda {

  /**
   * Crear una nueva instancia de Celda
   *
   * @constructor
   *
   * @param {Object} data - Datos de la celda
   * @param {number} data.id_celda - Identificador único de la celda
   * @param {string} data.numero - Número o código de la celda
   * @param {string} data.tipo - Tipo de celda (carro, moto, discapacitado)
   * @param {string} data.estado - Estado de la celda (libre, ocupada, reservada)
   * @param {number} data.id_parqueadero - ID del parqueadero al que pertenece
   */
  constructor({ id_celda, numero, tipo, estado, id_parqueadero }) {

    /**
     * Identificador único de la celda
     * @type {number}
     */
    this.id_celda = id_celda;

    /**
     * Número o código de la celda
     * @type {string}
     */
    this.numero = numero;

    /**
     * Tipo de celda
     * Ejemplo: carro, moto, discapacitado
     * @type {string}
     */
    this.tipo = tipo;

    /**
     * Estado actual de la celda
     * Ejemplo: libre, ocupada, reservada
     * @type {string}
     */
    this.estado = estado;

    /**
     * ID del parqueadero al que pertenece la celda
     * @type {number}
     */
    this.id_parqueadero = id_parqueadero;
  }

}

module.exports = Celda;