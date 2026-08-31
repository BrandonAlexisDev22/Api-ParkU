/**
 * @module HorarioOperacion
 * @description Ventana horaria global en la que el sistema acepta operaciones de
 * parqueo (reservar, ingresar, salir): 04:00–21:00, hora de Bogotá.
 *
 * La hora se calcula explícitamente en America/Bogota con Intl (UTC-5, sin horario de
 * verano) en vez de depender de la zona horaria del proceso de Node -- así el chequeo
 * es correcto sin importar cómo esté configurado el servidor de despliegue.
 */

const HORA_APERTURA = 4;
const HORA_CIERRE = 21;
const ZONA_HORARIA = 'America/Bogota';

const formatoHoraBogota = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_HORARIA,
  hour: 'numeric',
  hour12: false,
});

/**
 * Hora del día (0-23) en Bogotá para un instante dado, sin importar la zona horaria
 * del proceso.
 * @private
 * @param {Date} fecha
 * @returns {number}
 */
const _horaEnBogota = (fecha) => {
  const hora = parseInt(formatoHoraBogota.format(fecha), 10);
  return hora === 24 ? 0 : hora; // Intl con hour12:false puede devolver "24" para medianoche.
};

/**
 * Indica si un momento dado cae dentro de la ventana de operación (hora de Bogotá).
 * @param {Date} [fecha] - Por defecto, el momento actual.
 * @returns {boolean}
 */
const estaDentroDeHorarioOperacion = (fecha = new Date()) => {
  const hora = _horaEnBogota(fecha);
  return hora >= HORA_APERTURA && hora < HORA_CIERRE;
};

/**
 * Lanza un 400 si el momento actual está fuera de la ventana de operación.
 * @throws {Object} 400 si está fuera de horario.
 */
const validarHorarioOperacion = () => {
  if (!estaDentroDeHorarioOperacion()) {
    throw {
      status: 400,
      message: `Esta operación solo está permitida entre las ${String(HORA_APERTURA).padStart(2, '0')}:00 y las ${String(HORA_CIERRE).padStart(2, '0')}:00 (hora de Bogotá)`,
    };
  }
};

module.exports = { HORA_APERTURA, HORA_CIERRE, estaDentroDeHorarioOperacion, validarHorarioOperacion };
