/**
 * @module ConductorModel
 * @description
 * Clase que representa la entidad Conductor dentro del sistema ParkU.
 * Modela la estructura de un conductor en la aplicación.
 */

/**
 * Representa un conductor dentro del sistema.
 *
 * @class Conductor
 *
 * @param {number} id - Identificador único del conductor
 * @param {string} nombre - Nombre del conductor
 * @param {string} apellido - Apellido del conductor
 * @param {string} numeroDocumento - Número de documento del conductor
 * @param {string} tipoDocumento - Tipo de documento (CC, CE, PAS, etc.)
 * @param {string} telefono - Número de teléfono del conductor
 * @param {string} correo - Correo electrónico del conductor
 */

class Conductor {
    constructor(id_conductor, nombre, apellido, numeroDocumento, tipoDocumento, telefono, correo) {

        /** @type {number} */
        this.id_conductor = id_conductor

        /** @type {string} */
        this.nombre = nombre

        /** @type {string} */
        this.apellido = apellido

        /** @type {string} */
        this.numeroDocumento = numeroDocumento

        /** @type {string} */
        this.tipoDocumento = tipoDocumento

        /** @type {string} */
        this.telefono = telefono

        /** @type {string} */
        this.correo = correo
    }
}

module.exports = Conductor;