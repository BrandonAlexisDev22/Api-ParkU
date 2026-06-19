/**
 * @module RoleModel
 * @description
 * Clase que representa la entidad Rol dentro del sistema ParkU.
 * Sincronizada con la tabla 'rol' de la base de datos.
 */

class Role {
  /**
   * @param {number} id - Identificador único del rol
   * @param {string} nombre - Nombre del rol
   * @param {Array<Object>} [permisos=[]] - Lista de permisos asociados al rol
   */
  constructor(id, nombre, permisos = []) {

    /** @type {number} */
    this.id = id;

    /** @type {string} */
    this.nombre = nombre;

    /**
     * @type {Array<Object>}
     * Permisos obtenidos mediante JOIN con rol_permiso y permiso
     */
    this.permisos = permisos;
  }
}

module.exports = Role;