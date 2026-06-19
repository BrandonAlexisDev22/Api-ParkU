/**
 * @module UsuarioModel
 * @description
 * Clase que representa la entidad Usuario dentro del sistema ParkU.
 * Sincronizada con la tabla 'usuario' de la base de datos en Railway.
 */

class Usuario {
  /**
   * @param {number} id - Identificador único (id en SQL)
   * @param {string} nombre - Nombre completo del usuario
   * @param {string} correo - Correo electrónico (único)
   * @param {string} contrasena - Contraseña encriptada (contrasena en SQL)
   * @param {string} numero - Número de teléfono o contacto
   * @param {number} rol - ID del rol asociado (rol en SQL)
   * @param {number} [estado=1] - Estado (1: activo, 0: inactivo)
   */
  constructor(id, nombre, correo, contrasena, numero, rol, estado = true) {
    
    /** @type {number} */
    this.id = id; // Cambiado de id_usuario a id

    /** @type {string} */
    this.nombre = nombre;

    /** @type {string} */
    this.correo = correo;

    /** @type {string} */
    this.contrasena = contrasena; // Cambiado de password a contrasena

    /** @type {string} */
    this.numero = numero; // Nuevo campo presente en tu SQL

    /** @type {number} */
    this.rol = rol; // Cambiado de rol_id a rol

    /** @type {number} */
    this.estado = estado; 
  }
}

module.exports = Usuario;