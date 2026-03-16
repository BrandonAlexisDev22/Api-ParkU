/**
 * @module ParqueaderoModel
 * @description
 * Clase que representa la entidad Parqueadero dentro del sistema ParkU.
 * Sincronizada con la tabla 'parqueadero' de la base de datos en Railway.
 */

class Parqueadero {
  /**
   * @param {number} id - Identificador único (id en SQL)
   * @param {string} nombre - Nombre de la sede
   * @param {string} direccion - Dirección física
   * @param {number} capacidad - Capacidad máxima (capacidad en SQL)
   * @param {number|boolean} estado - Estado (1 para activo, 0 para inactivo)
   */
  constructor(id, nombre, direccion, capacidad, estado = 1) {
    
    /** @type {number} */
    this.id = id;

    /** @type {string} */
    this.nombre = nombre;

    /** @type {string} */
    this.direccion = direccion;

    /** @type {number} */
    this.capacidad = capacidad;

    /** * @type {number} 
     * En MySQL solemos usar TINYINT (0 o 1) para representar booleanos.
     */
    this.estado = estado;
  }
}

module.exports = Parqueadero;