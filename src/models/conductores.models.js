/**
 * @module ConductorModel
 * @description
 * Clase que representa la entidad Conductor dentro del sistema ParkU.
 * Sincronizada con la tabla 'conductor' de la base de datos.
 */

class Conductor {

  /**
   * @param {number} id - Identificador único del conductor
   * @param {string} nombre - Nombre completo del conductor
   * @param {string} tipo_documento - Tipo de documento (CC, CE, PAS, etc.)
   * @param {number} documento - Número de documento
   * @param {string|null} licencia - Número de licencia de conducción
   * @param {string|null} correo - Correo electrónico
   * @param {string|null} numero - Número telefónico
   * @param {number} perfil - ID del perfil asociado
   * @param {boolean} estado - Estado del conductor
   */
  constructor(
    id,
    nombre,
    tipo_documento,
    documento,
    licencia,
    correo,
    numero,
    perfil,
    estado = true
  ) {

    /** @type {number} */
    this.id = id;

    /** @type {string} */
    this.nombre = nombre;

    /** @type {string} */
    this.tipo_documento = tipo_documento;

    /** @type {number} */
    this.documento = documento;

    /** @type {string|null} */
    this.licencia = licencia;

    /** @type {string|null} */
    this.correo = correo;

    /** @type {string|null} */
    this.numero = numero;

    /**
     * Referencia a perfil.id
     * @type {number}
     */
    this.perfil = perfil;

    /**
     * TRUE = Activo
     * FALSE = Inactivo
     * @type {boolean}
     */
    this.estado = estado;
  }
}

module.exports = Conductor;q