/**
 * @module UsuarioModel
 * @description
 * Clase que representa la entidad Usuario dentro del sistema ParkU.
 * Modela la estructura de un usuario en la aplicación.
 */

/**
 * Representa un usuario dentro del sistema.
 *
 * @class Usuario
 * @param {number} id - Identificador único del usuario
 * @param {string} nombre - Nombre del usuario
 * @param {string} correo - Correo electrónico del usuario
 * @param {string} password - Contraseña del usuario
 * @param {number} rol_id - ID del rol asociado al usuario
 * @param {boolean} [estado=true] - Estado del usuario (activo o inactivo)
 */
class Usuario {
  constructor(id, nombre, correo, password, rol_id, estado = true) {
    this.id_usuario = id;
    this.nombre = nombre;
    this.correo = correo;
    this.password = password;
    this.rol_id = rol_id;
    this.estado = estado;
  }
}

module.exports = Usuario;