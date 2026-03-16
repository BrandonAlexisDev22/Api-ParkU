/**
 * Representa el control de salida de un vehículo del sistema.
 */
class ControlSalida {

    /**
     * Crea una instancia de ControlSalida.
     * 
     * @param {number} id_control_salida - ID del control de salida.
     * @param {number} id_asignacion - ID de la asignación de celda.
     * @param {number} id_vehiculo - ID del vehículo.
     * @param {number} id_conductor - ID del conductor.
     * @param {string} fecha_salida - Fecha en que el vehículo sale.
     * @param {string} hora_salida - Hora en que el vehículo sale.
     * @param {string} estado_salida - Estado de la salida (autorizado, pendiente, etc.).
     * @param {string} observaciones - Observaciones adicionales.
     */
    constructor(id_control_salida,id_asignacion,id_vehiculo,id_conductor,fecha_salida,hora_salida,estado_salida,observaciones
    ) {

        this.id_control_salida = id_control_salida;
        this.id_asignacion = id_asignacion;
        this.id_vehiculo = id_vehiculo;
        this.id_conductor = id_conductor;
        this.fecha_salida = fecha_salida;
        this.hora_salida = hora_salida;
        this.estado_salida = estado_salida;
        this.observaciones = observaciones;
    }
}

module.exports = ControlSalida;