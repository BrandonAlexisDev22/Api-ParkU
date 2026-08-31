/**
 * @module HorarioOperacion
 * @description Ventana horaria global en la que el sistema acepta operaciones de
 * parqueo (reservar, ingresar, salir): 04:00–21:00, hora del proceso de Node.
 *
 * IMPORTANTE: no fija zona horaria propia -- depende de la del proceso (TZ del SO/
 * variable de entorno). Si el servidor de despliegue no corre en horario de Colombia,
 * fijar TZ=America/Bogota en el entorno antes de confiar en esta ventana en producción.
 */

const HORA_APERTURA = 4;
const HORA_CIERRE = 21;

/**
 * Indica si un momento dado cae dentro de la ventana de operación.
 * @param {Date} [fecha] - Por defecto, el momento actual.
 * @returns {boolean}
 */
const estaDentroDeHorarioOperacion = (fecha = new Date()) => {
  const hora = fecha.getHours();
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
      message: `Esta operación solo está permitida entre las ${String(HORA_APERTURA).padStart(2, '0')}:00 y las ${String(HORA_CIERRE).padStart(2, '0')}:00`,
    };
  }
};

module.exports = { HORA_APERTURA, HORA_CIERRE, estaDentroDeHorarioOperacion, validarHorarioOperacion };
