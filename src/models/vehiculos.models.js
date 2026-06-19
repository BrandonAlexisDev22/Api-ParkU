/**
 * @module VehiculoModel
 * @description
 * Clase que representa la entidad Vehículo dentro del sistema ParkU.
 * Sincronizada con la tabla 'vehiculo' de la base de datos.
 */

class Vehiculo {

  /**
   * @param {number} id - Identificador único del vehículo
   * @param {number} conductor - ID del conductor asociado
   * @param {string} placa - Placa única del vehículo
   * @param {string} tipo - Tipo de vehículo
   * @param {string|null} marca - Marca del vehículo
   * @param {string|null} modelo - Modelo del vehículo
   * @param {number|null} anio - Año de fabricación
   * @param {string|null} color - Color del vehículo
   * @param {string|null} descripcion - Información adicional
   * @param {boolean} estado - Estado del vehículo
   */
  constructor(
    id,
    conductor,
    placa,
    tipo,
    marca,
    modelo,
    anio,
    color,
    descripcion,
    estado = true
  ) {

    /** @type {number} */
    this.id = id;

    /**
     * Referencia a conductor.id
     * @type {number}
     */
    this.conductor = conductor;

    /** @type {string} */
    this.placa = placa;

    /**
     * CARRO | MOTO | BICICLETA
     * @type {string}
     */
    this.tipo = tipo;

    /** @type {string|null} */
    this.marca = marca;

    /** @type {string|null} */
    this.modelo = modelo;

    /** @type {number|null} */
    this.anio = anio;

    /** @type {string|null} */
    this.color = color;

    /** @type {string|null} */
    this.descripcion = descripcion;

    /**
     * TRUE = Activo
     * FALSE = Inactivo
     * @type {boolean}
     */
    this.estado = estado;
  }
}

module.exports = Vehiculo;