/**
 * @module PermisoModels
 * @description
 * Clase que representa la entidad Role dentro del sistema ParkU.
 * Modela la estructura de un permiso en la aplicación.
 */

/**
 * Representa un permiso dentro del sistema.
 *
 * @class Permiso
 * @param {number} id - Identificador único del permisos
 * @param {string} rol_id - id del rol asociado
 * @param {Array<string>} permisos - Lista de modulos asociados al permiso
 * @param {boolean} [estado=true] - Estado del rol (activo o inactivo)
 */

class Permiso {
    constructor(id,rol_id,modulo,estado){
        this.id = id;
        this.rol_id = rol_id,
        this.modulo = modulo,
        this.estado = estado
    }
}


module.exports = Permiso;