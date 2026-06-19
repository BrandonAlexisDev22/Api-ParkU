/**
 * @module CeldaModel
 * @description
 * Clase que representa una celda dentro del sistema ParkU.
 * Sincronizada con la tabla 'celda' de la base de datos.
 */

class Celda {

  /**
   * @param {number} id - Identificador único de la celda
   * @param {number} parqueadero - ID del parqueadero al que pertenece
   * @param {string} tipo - Tipo de celda
   * @param {string} usabilidad - Nivel de uso permitido
   * @param {string} estado_celda - Estado actual de la celda
   */
  constructor(
    id,
    parqueadero,
    tipo,
    usabilidad,
    estado_celda
  ) {

    /**
     * Identificador único de la celda
     * @type {number}
     */
    this.id = id;

    /**
     * ID del parqueadero asociado
     * @type {number}
     */
    this.parqueadero = parqueadero;

    /**
     * Tipo de celda
     * Valores:
     * CARRO
     * MOTO
     * MOVILIDAD_REDUCIDA
     * BICICLETA
     * @type {string}
     */
    this.tipo = tipo;

    /**
     * Usabilidad de la celda
     * Valores:
     * GENERAL
     * EJECUTIVO
     * MOVILIDAD_REDUCIDA
     * @type {string}
     */
    this.usabilidad = usabilidad;

    /**
     * Estado actual de la celda
     * Valores:
     * DISPONIBLE
     * OCUPADO
     * MANTENIMIENTO
     * INACTIVA
     * @type {string}
     */
    this.estado_celda = estado_celda;
  }
}

module.exports = Celda;