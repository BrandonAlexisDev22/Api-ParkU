/**
 * @module PermisoModel
 * @description
 * Clase que representa la entidad Permiso dentro del sistema ParkU.
 * Modela la estructura de un permiso en la aplicación.
 */

/**
 * Representa un permiso dentro del sistema.
 *
 * @class Permiso
 *
 * @param {number} id_permiso - Identificador único del permiso
 * @param {string} nombre_permiso - Nombre del permiso
 * @param {string} modulo - Módulo al que pertenece el permiso
 * @param {boolean} [estado=true] - Estado del permiso (activo o inactivo)
 */

class Permiso {

    constructor(id_permiso, nombre_permiso, modulo, estado = true) {
        this.id_permiso = id_permiso;
        this.nombre_permiso = nombre_permiso;
        this.modulo = modulo;
        this.estado = estado;
    }

}

module.exports = Permiso;

