/**
 * @module VehiculoModel
 * @description
 * Clase que representa la entidad Vehículo dentro del sistema ParkU.
 * Modela la estructura de un vehículo en la aplicación.
 */

/**
 * Representa un vehículo dentro del sistema.
 *
 * @class Vehiculo
 *
 * @param {number} id_vehiculo - Identificador único del vehículo
 * @param {string} placa - Placa del vehículo
 * @param {string} tipoVehiculo - Tipo de vehículo (carro, moto, bicicleta)
 * @param {string} marca - Marca del vehículo
 * @param {string} modelo - Modelo del vehículo
 * @param {string} color - Color del vehículo
 * @param {number} id_conductor - ID del conductor asociado al vehículo
 */

class Vehiculo {
  constructor(id_vehiculo, placa, tipoVehiculo, marca, modelo, color, id_conductor) {

    /** @type {number} */
    this.id_vehiculo = id_vehiculo

    /** @type {string} */
    this.placa = placa

    /** @type {string} */
    this.tipoVehiculo = tipoVehiculo

    /** @type {string} */
    this.marca = marca

    /** @type {string} */
    this.modelo = modelo

    /** @type {string} */
    this.color = color

    /** @type {number} */
    this.id_conductor = id_conductor
  }
}

module.exports = Vehiculo