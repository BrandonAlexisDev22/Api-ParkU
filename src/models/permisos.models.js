/**
 * @module PermisoModel
 * @description
 * Clase que representa la entidad Permiso dentro del sistema ParkU.
 * Sincronizada con la tabla 'permiso' de la base de datos.
 */

class Permiso {

  /**
   * @param {number} id - Identificador único del permiso
   * @param {string} nombre - Nombre del permiso
   */
  constructor(id, nombre) {

    /** @type {number} */
    this.id = id;

    /** @type {string} */
    this.nombre = nombre;
  }
}

module.exports = Permiso;