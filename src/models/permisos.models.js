/**
 * @module PermisoModel
 * @description
 * Clase que representa la entidad Permiso dentro del sistema ParkU.
 * Sincronizada con la tabla 'permiso' de la base de datos en Railway.
 */

class Permiso {
  /**
   * @param {number} id - Identificador único (id en SQL)
   * @param {string} nombre - Nombre del permiso (nombre en SQL)
   * @param {string} [modulo] - Módulo asociado (Opcional, si se maneja en la lógica)
   */
  constructor(id, nombre, modulo = null) {
    
    /** @type {number} */
    this.id = id; // En SQL es 'id'

    /** @type {string} */
    this.nombre = nombre; // En SQL es 'nombre'

    /** * @type {string|null} 
     * Nota: Si tu tabla SQL no tiene columna 'modulo', 
     * este campo se usará solo en la lógica de la App.
     */
    this.modulo = modulo;
  }
}

module.exports = Permiso;