/**
 * @module VehiculoModel
 * @description
 * Clase que representa la entidad Vehículo dentro del sistema ParkU.
 * Sincronizada con la tabla 'vehiculo' de la base de datos parku.sql.
 */

class Vehiculo {
  /**
   * @param {number} id - Identificador único (Primary Key)
   * @param {number} conductor - ID del conductor asociado (FK)
   * @param {string} placa - Placa única del vehículo
   * @param {string} tipo - Tipo de vehículo (ej. carro, moto)
   * @param {string} marca - Marca del fabricante
   * @param {string} modelo - Modelo específico
   * @param {number} anio - Año de fabricación (YEAR en SQL)
   * @param {string} color - Color del vehículo
   * @param {string} descripcion - Detalles adicionales
   * @param {number} estado - Estado lógico (1: Activo, 0: Inactivo)
   */
  constructor(id, conductor, placa, tipo, marca, modelo, anio, color, descripcion, estado = 1) {
    
    /** @type {number} */
    this.id = id;

    /** @type {number} */
    this.conductor = conductor; // Antes: id_conductor

    /** @type {string} */
    this.placa = placa;

    /** @type {string} */
    this.tipo = tipo; // Antes: tipoVehiculo

    /** @type {string} */
    this.marca = marca;

    /** @type {string} */
    this.modelo = modelo;

    /** @type {number} */
    this.anio = anio; // Nuevo campo según parku.sql

    /** @type {string} */
    this.color = color;

    /** @type {string} */
    this.descripcion = descripcion; // Nuevo campo según parku.sql

    /** @type {number} */
    this.estado = estado; // Nuevo campo según parku.sql
  }
}

module.exports = Vehiculo;