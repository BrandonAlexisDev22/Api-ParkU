/**
 * @module RoleModel
 * @description
 * Clase que representa la entidad Role dentro del sistema ParkU.
 * Modela la estructura de un rol en la aplicación.
 */

/**
 * Representa un rol dentro del sistema.
 *
 * @class Role
 * @param {number} id - Identificador único del rol
 * @param {string} nombre_rol - Nombre del rol
 * @param {Array<string>} permisos - Lista de permisos asociados al rol
 * @param {boolean} [estado=true] - Estado del rol (activo o inactivo)
 */
class Role {
  constructor(id, nombre_rol, permisos, estado = true) {
    this.id_rol = id;
    this.nombre_rol = nombre_rol;
    this.permisos = permisos;
    this.estado = estado;
  }
}

module.exports = Role;