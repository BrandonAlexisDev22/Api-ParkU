/**
 * @module ParqueaderoModel
 * @description
 * Clase que representa la entidad Parqueadero dentro del sistema ParkU.
 * Sincronizada con la tabla 'parqueadero' de la base de datos.
 */

class Parqueadero {

  /**
   * @param {number} id - Identificador único del parqueadero
   * @param {string} nombre - Nombre del parqueadero
   * @param {string|null} ubicacion - Ubicación física del parqueadero
   * @param {number} celdas_totales - Total de celdas disponibles
   * @param {number} celdas_movilidad_reducida - Total de celdas para movilidad reducida
   * @param {number} celdas_motos - Total de celdas para motos
   * @param {number} celdas_carros - Total de celdas para carros
   * @param {boolean} estado - Estado del parqueadero
   */
  constructor(
    id,
    nombre,
    ubicacion,
    celdas_totales,
    celdas_movilidad_reducida,
    celdas_motos,
    celdas_carros,
    estado = true
  ) {

    /** @type {number} */
    this.id = id;

    /** @type {string} */
    this.nombre = nombre;

    /** @type {string|null} */
    this.ubicacion = ubicacion;

    /** @type {number} */
    this.celdas_totales = celdas_totales;

    /** @type {number} */
    this.celdas_movilidad_reducida = celdas_movilidad_reducida;

    /** @type {number} */
    this.celdas_motos = celdas_motos;

    /** @type {number} */
    this.celdas_carros = celdas_carros;

    /**
     * TRUE = Activo
     * FALSE = Inactivo
     * @type {boolean}
     */
    this.estado = estado;
  }
}

module.exports = Parqueadero;