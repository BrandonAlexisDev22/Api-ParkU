/**
 * @module ReglasReserva
 * @description Reglas de tiempo de una reserva, en un solo sitio.
 *
 * Son tres, y las tres existen para que una celda reservada sea una celda que de verdad se
 * va a usar:
 *
 * - **Anticipación mínima**: no se reserva "para ya". Hay que pedirla con al menos media
 *   hora de margen, que es lo que tarda alguien en llegar al parqueadero.
 * - **Duración mínima**: una reserva de diez minutos bloquea la celda y no le sirve a nadie.
 * - **Margen para cancelar**: cancelar cinco minutos antes deja la celda vacía sin tiempo de
 *   que otra persona la aproveche, así que la cancelación también se cierra media hora antes
 *   del inicio.
 *
 * El frontend repite estos mismos números (src/features/reservas/lib/reglas.ts) para poder
 * avisar mientras se escribe; esta copia es la que manda.
 */

/** Minutos que como mínimo deben faltar para el inicio al crear la reserva. */
const ANTICIPACION_MINIMA_MINUTOS = 30;

/** Duración mínima de una reserva, en minutos. */
const DURACION_MINIMA_MINUTOS = 60;

/** Minutos antes del inicio hasta los que se admite cancelar. */
const MARGEN_CANCELACION_MINUTOS = 30;

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
  MARGEN_CANCELACION_MINUTOS,
  MINUTO_MS,
  _enPalabras,
};
