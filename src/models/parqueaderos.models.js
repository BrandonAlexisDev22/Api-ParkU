/**
 * @module ParqueaderoModel
 * @description
 * Clase que representa la entidad Parqueadero dentro del sistema ParkU.
 * Modela la estructura de un parqueadero en la aplicación.
 */

/**
 * Representa un parqueadero dentro del sistema.
 *
 * @class Parqueadero
 * @param {number} id - Identificador único del parqueadero
 * @param {string} nombre - Nombre del parqueadero
 * @param {string} direccion - Dirección del parqueadero
 * @param {number} capacidad_total - Número total de espacios disponibles
 * @param {number} espacios_disponibles - Espacios disponibles actualmente
 * @param {boolean} [estado=true] - Estado del parqueadero (activo o inactivo)
 */
class Parqueadero {

  constructor(id, nombre, direccion, capacidad_total, espacios_disponibles, estado = true) {

    this.id_parqueadero = id;
    this.nombre = nombre;
    this.direccion = direccion;
    this.capacidad_total = capacidad_total;
    this.espacios_disponibles = espacios_disponibles;
    this.estado = estado;

  }

}

module.exports = Parqueadero;