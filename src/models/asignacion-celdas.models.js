/**
 * @class AsignacionDeCelda
 * @description
 * Modelo que representa la asignación de una celda de parqueadero
 * a un vehículo y su conductor dentro del sistema.
 */
class AsignacionDeCelda {

    /**
     * Crea una nueva asignación de celda.
     * 
     * @constructor
     * @param {number} id_asignacion - Identificador único de la asignación.
     * @param {number} id_celda - Identificador de la celda asignada.
     * @param {number} id_vehiculo - Identificador del vehículo.
     * @param {number} id_conductor - Identificador del conductor.
     * @param {string} fecha_ingreso - Fecha en que el vehículo ingresa.
     * @param {string} hora_ingreso - Hora en que el vehículo ingresa.
     * @param {string|null} fecha_salida - Fecha de salida del vehículo.
     * @param {string|null} hora_salida - Hora de salida del vehículo.
     * @param {string} estado - Estado de la asignación (activa, finalizada).
     */
    constructor(
        id_asignacion,
        id_celda,
        id_vehiculo,
        id_conductor,
        fecha_ingreso,
        hora_ingreso,
        fecha_salida,
        hora_salida,
        estado
    ) {

        /** @type {number} */
        this.id_asignacion = id_asignacion;

        /** @type {number} */
        this.id_celda = id_celda;

        /** @type {number} */
        this.id_vehiculo = id_vehiculo;

        /** @type {number} */
        this.id_conductor = id_conductor;

        /** @type {string} */
        this.fecha_ingreso = fecha_ingreso;

        /** @type {string} */
        this.hora_ingreso = hora_ingreso;

        /** @type {string|null} */
        this.fecha_salida = fecha_salida;

        /** @type {string|null} */
        this.hora_salida = hora_salida;

        /** @type {string} */
        this.estado = estado;
    }
}

module.exports = AsignacionDeCelda;