/**
 * @module ReglasReserva
 * @description Reglas de tiempo de una reserva, en un solo sitio.
 *
 * Todas existen para lo mismo: que una celda apartada sea una celda que de verdad se va a
 * usar, y que quien la aparta sepa a qué atenerse.
 *
 * - **Anticipación mínima**: no se reserva "para ya". Hay que pedirla con dos horas de
 *   margen, tiempo suficiente para que quien atiende el parqueadero la vea y la apruebe.
 * - **Duración mínima**: una reserva de diez minutos bloquea la celda y no le sirve a nadie.
 * - **Hora máxima de inicio**: empezar una reserva pegada a la hora de cierre no tiene
 *   sentido. La hora de FIN sí puede llegar hasta el cierre.
 * - **Margen para confirmar**: una solicitud que nadie aprobó a media hora del inicio se
 *   rechaza sola; a esas alturas ya no da tiempo de organizarse.
 * - **Margen para cancelar**: cancelar sobre la hora deja la celda vacía sin que otra
 *   persona pueda aprovecharla.
 * - **Margen de llegada**: pasado ese rato desde el inicio sin que llegue el vehículo, la
 *   reserva se cancela y la celda se suelta.
 *
 * El frontend repite estos mismos números (src/features/reservas/lib/reglas.ts) para poder
 * avisar mientras se escribe; esta copia es la que manda.
 */

/** Minutos que como mínimo deben faltar para el inicio al crear la reserva. */
const ANTICIPACION_MINIMA_MINUTOS = 120;

/** Duración mínima de una reserva, en minutos. */
const DURACION_MINIMA_MINUTOS = 60;

/**
 * Última hora a la que puede EMPEZAR una reserva (hora de Bogotá). El cierre es a las 21:00
 * y la reserva puede extenderse hasta ahí, pero arrancar a las 20:45 no tiene coherencia.
 */
const HORA_MAXIMA_INICIO = '19:30';

/** Minutos antes del inicio hasta los que se admite cancelar. */
const MARGEN_CANCELACION_MINUTOS = 30;

/**
 * Minutos antes del inicio hasta los que una solicitud puede seguir esperando aprobación.
 * Si nadie la acepta antes, se rechaza sola.
 */
const MARGEN_CONFIRMACION_MINUTOS = 30;

/**
 * Con cuánta antelación a la próxima reserva se puede ocupar una celda que tiene agenda.
 * Menos de esto no da tiempo a usarla y desalojar con orden, así que no se admite el ingreso.
 */
const MARGEN_ESTACIONAR_ANTES_MINUTOS = 120;

/**
 * A qué hora, como muy tarde, tiene que haber salido quien ocupó una celda con reserva
 * próxima: media hora antes de que empiece, para que la celda esté libre y limpia a tiempo.
 */
const MARGEN_SALIDA_ANTES_MINUTOS = 30;

/**
 * Cuándo se avisa al vigilante de que hay que desalojar: veinte minutos antes del plazo
 * máximo de salida, para que dé tiempo a localizar al conductor y que mueva el vehículo.
 */
const AVISO_DESALOJO_MINUTOS = MARGEN_SALIDA_ANTES_MINUTOS + 20;

/** Cuándo se avisa de que se acerca la siguiente reserva de una celda ya reservada. */
const AVISO_PROXIMA_RESERVA_MINUTOS = 30;

/**
 * Minutos que se le esperan al vehículo desde la hora de inicio. Pasados estos, la reserva se
 * cancela sola y la celda vuelve a estar disponible: una celda apartada para alguien que no
 * llegó es una celda que nadie puede usar.
 */
const MARGEN_LLEGADA_MINUTOS = 20;

/** Lo que queda escrito en la reserva cuando cambia sola, para que se sepa por qué. */
const MOTIVO_VENCIMIENTO_ACEPTADA = `Cancelada automáticamente: pasaron ${MARGEN_LLEGADA_MINUTOS} minutos desde la hora de inicio sin que el vehículo llegara, y la celda se liberó.`;
const MOTIVO_SIN_CONFIRMAR = `Rechazada automáticamente: la solicitud no se aprobó a ${MARGEN_CONFIRMACION_MINUTOS} minutos de la hora de inicio.`;

/** Cuando se acepta una reserva, las que competían por esa misma franja se cancelan con esto. */
const MOTIVO_FRANJA_TOMADA = 'Cancelada automáticamente: se aceptó otra reserva para esa misma celda y franja horaria.';

const MINUTO_MS = 60 * 1000;

/**
 * Redacta la duración en un texto legible ("1 hora", "30 minutos").
 * @private
 */
const _enPalabras = (minutos) => {
  if (minutos % 60 === 0) {
    const horas = minutos / 60;
    return horas === 1 ? '1 hora' : `${horas} horas`;
  }
  return `${minutos} minutos`;
};

module.exports = {
  ANTICIPACION_MINIMA_MINUTOS,
  DURACION_MINIMA_MINUTOS,
  HORA_MAXIMA_INICIO,
  MARGEN_CANCELACION_MINUTOS,
  MARGEN_CONFIRMACION_MINUTOS,
  MARGEN_LLEGADA_MINUTOS,
  MARGEN_ESTACIONAR_ANTES_MINUTOS,
  MARGEN_SALIDA_ANTES_MINUTOS,
  AVISO_DESALOJO_MINUTOS,
  AVISO_PROXIMA_RESERVA_MINUTOS,
  MOTIVO_VENCIMIENTO_ACEPTADA,
  MOTIVO_SIN_CONFIRMAR,
  MOTIVO_FRANJA_TOMADA,
  MINUTO_MS,
  _enPalabras,
};
