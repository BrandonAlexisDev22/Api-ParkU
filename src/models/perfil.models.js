/**
 * @module ProfileModel
 * @description
 * Clase que representa la entidad Perfil dentro del sistema ParkU.
 * Sincronizada con la tabla 'perfil' de la base de datos.
 */

class Profile {
  /**
   * @param {number} id - Identificador único del perfil
   * @param {string} nombre - Nombre del perfil
   * @param {string|null} descripcion - Descripción del perfil
   */
  constructor(id, nombre, descripcion = null) {

    /** @type {number} */
    this.id = id;

    /** @type {string} */
    this.nombre = nombre;

    /** @type {string|null} */
    this.descripcion = descripcion;
  }
}

module.exports = Profile;