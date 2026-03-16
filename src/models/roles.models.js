/**
 * @module RoleModel
 * @description
 * Clase que representa la entidad Role dentro del sistema ParkU.
 * Sincronizada con la tabla 'rol' y la lógica de permisos de la base de datos.
 */

class Role {
  /**
   * @param {number} id - Identificador único (id en SQL)
   * @param {string} nombre - Nombre del rol (nombre en SQL)
   * @param {Array<Object>} [permisos=[]] - Lista de objetos de permisos asociados
   */
  constructor(id, nombre, permisos = []) {
    
    /** @type {number} */
    this.id = id; // Cambiado de id_rol a id

    /** @type {string} */
    this.nombre = nombre; // Cambiado de nombre_rol a nombre

    /** * @type {Array<Object>} 
     * En SQL, los permisos vienen de la tabla 'rol_permiso' mediante un JOIN
     */
    this.permisos = permisos;
  }
}

module.exports = Role;