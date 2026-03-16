/**
 * @module ReconocimientoModel
 * @description
 * Clase que representa la entidad EntradaSalida dentro del sistema ParkU.
 * Modela el registro generado por el sistema de cámaras al detectar un vehículo.
 */

class Reconocimiento {
  /**
   * @param {number} id - Identificador único (id en SQL)
   * @param {number} vehiculo - ID del vehículo detectado (FK)
   * @param {string} fecha_hora - Marca de tiempo del evento (TIMESTAMP)
   * @param {string} tipo - Tipo de evento ('Entrada' o 'Salida')
   * @param {string} evidencia - Información adicional (URL imagen, cámara, confianza)
   */
  constructor(id, vehiculo, fecha_hora, tipo, evidencia) {
    
    /** @type {number} */
    this.id = id; // Cambiado de id_reconocimiento a id para cumplir con el SQL

    /** * @type {number} 
     * Representa la relación con la tabla 'vehiculo'
     */
    this.vehiculo = vehiculo;

    /** @type {string} */
    this.fecha_hora = fecha_hora;

    /** * @type {string} 
     * Según SQL: ENUM('Entrada', 'Salida')
     */
    this.tipo = tipo;

    /** * @type {string} 
     * Aquí puedes guardar un JSON con {camara: "Acceso A", confianza: 0.98} 
     * o la URL de la foto de la placa.
     */
    this.evidencia = evidencia;
  }
}

module.exports = Reconocimiento;