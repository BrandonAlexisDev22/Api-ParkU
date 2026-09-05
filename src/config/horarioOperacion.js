/**
 * @module HorarioOperacion
 * @description Ventana horaria global en la que el sistema acepta operaciones de
 * parqueo (reservar, ingresar, salir): 05:00–21:00, hora de Bogotá.
 *
 * La hora se calcula explícitamente en America/Bogota con Intl (UTC-5, sin horario de
 * verano) en vez de depender de la zona horaria del proceso de Node -- así el chequeo
 * es correcto sin importar cómo esté configurado el servidor de despliegue.
 */

const HORA_APERTURA = 5;
const HORA_CIERRE = 21;
const ZONA_HORARIA = 'America/Bogota';

const formatoHoraBogota = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_HORARIA,
  hour: 'numeric',
  hour12: false,
});

// 'en-CA' produce directamente YYYY-MM-DD, cómodo para reconstruir una fecha concreta.
const formatoFechaBogota = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
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

/**
 * Instante (Date, en UTC internamente) que corresponde a la hora de cierre (HORA_CIERRE:00)
 * del día -- en Bogotá -- al que pertenece `fecha`. Bogotá está fija en UTC-5 (sin horario
 * de verano, ver cabecera del módulo), así que el cierre de las HORA_CIERRE:00 locales
 * equivale siempre a (HORA_CIERRE + 5):00 UTC del mismo día calendario en Bogotá.
 * @private
 * @param {Date} fecha
 * @returns {Date}
 */
const _momentoCierreDelDia = (fecha) => {
  const [anio, mes, dia] = formatoFechaBogota.format(fecha).split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia, HORA_CIERRE + 5, 0, 0));
};

/**
 * Minutos transcurridos desde el último cierre (HORA_CIERRE) para un momento dado que cae
 * fuera de la ventana de operación. Devuelve 0 si `fecha` sí está dentro del horario.
 * Sirve para reportar "tiempo excedido" de un vehículo que sigue dentro después del cierre
 * (incluida la madrugada siguiente, cuando el cierre de referencia es el del día anterior).
 * @param {Date} [fecha] - Por defecto, el momento actual.
 * @returns {number}
 */
const minutosFueraDeHorario = (fecha = new Date()) => {
  if (estaDentroDeHorarioOperacion(fecha)) return 0;

  const cierreHoy = _momentoCierreDelDia(fecha);
  // Antes de la apertura (madrugada): el cierre de referencia es el de ayer, no el de hoy.
  const referencia = fecha < cierreHoy ? new Date(cierreHoy.getTime() - 24 * 60 * 60 * 1000) : cierreHoy;
  return Math.max(0, Math.round((fecha - referencia) / 60000));
};

/**
 * "HH:MM" en hora de Bogotá para un instante dado. Sirve para comparar la hora de una
 * reserva con las de la ventana de operación sin depender de la zona horaria del proceso.
 * @param {Date} fecha
 * @returns {string}
 */
const horaEnBogotaTexto = (fecha) => {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONA_HORARIA, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(fecha);
  return partes === '24:00' ? '00:00' : partes;
};

module.exports = {
  HORA_APERTURA,
  HORA_CIERRE,
  horaEnBogotaTexto,
  estaDentroDeHorarioOperacion,
  validarHorarioOperacion,
  minutosFueraDeHorario,
};
