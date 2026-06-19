/**
 * @module RolePermissionModel
 * @description
 * Clase que representa la relación entre Roles y Permisos.
 * Sincronizada con la tabla 'rol_permiso' de la base de datos.
 */

class RolePermission {
  /**
   * @param {number} id - Identificador único de la relación
   * @param {number} rol - ID del rol asociado
   * @param {number} permiso - ID del permiso asociado
   */
  constructor(id, rol, permiso) {

    /** @type {number} */
    this.id = id;

    /**
     * @type {number}
     * Referencia a rol.id
     */
    this.rol = rol;

    /**
     * @type {number}
     * Referencia a permiso.id
     */
    this.permiso = permiso;
  }
}

module.exports = RolePermission;