/**
 * @module AvisosConductorService
 * @description Avisos "de información" al conductor: cuando su vehículo entra o sale del
 * parqueadero y cuando su reserva cambia de estado. Cada aviso llega por dos vías:
 *
 *  - una fila en `notificacion` (la campana de la app móvil, GET /api/notificaciones), y
 *  - un correo, con la plantilla correspondiente de mailer.util.js.
 *
 * Nunca lanzan: son un efecto secundario de una operación que ya quedó guardada (el ingreso,
 * la salida, la reserva). Si el correo falla o el conductor no tiene cuenta, se anota en el
 * log y la operación sigue siendo válida.
 *
 * Aquí NO va la verificación de correo ni la recuperación de contraseña: eso no es
 * información para el conductor sino mecánica de la cuenta (y la verificación se quitó).
 */

const conductorRepo = require('../repositories/conductor.repository');
const vehRepo = require('../repositories/vehiculo.repository');
const celdaRepo = require('../repositories/celda.repository');
const parqRepo = require('../repositories/parqueadero.repository');
const notificacionRepo = require('../repositories/notificacion.repository');
const { enviarCorreoAcceso, enviarCorreoReserva, enviarSinBloquear } = require('../utils/mailer.util');
const { horaEnBogotaTexto } = require('../config/horarioOperacion');
const Logger = require('../utils/logger.util');

const ZONA_HORARIA = 'America/Bogota';

/** "miércoles, 16 de septiembre de 2026" en hora de Bogotá. */
const fechaEnBogotaTexto = (fecha) =>
  new Intl.DateTimeFormat('es-CO', { timeZone: ZONA_HORARIA, dateStyle: 'full' }).format(fecha);

/** "2 h 15 min" / "35 min". */
const duracionTexto = (desde, hasta) => {
  const minutos = Math.max(0, Math.round((hasta.getTime() - desde.getTime()) / 60000));
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
};

/**
 * Quién recibe el aviso: el conductor indicado o, si no viene, el propietario principal del
 * vehículo. Devuelve null si no hay a quién avisar (vehículo sin dueño registrado).
 * @private
 * @returns {Promise<{conductor: Object, usuarioId: number|null, correo: string|null, nombre: string}|null>}
 */
const _destinatario = async ({ conductorId, vehiculoId }) => {
  let conductor = conductorId ? await conductorRepo.findById(conductorId) : null;
  if (!conductor && vehiculoId) {
    const vehiculo = await vehRepo.findById(vehiculoId);
    if (vehiculo?.conductor_principal_id) conductor = await conductorRepo.findById(vehiculo.conductor_principal_id);
  }
  if (!conductor) return null;
  return {
    conductor,
    usuarioId: conductor.usuario_id ? Number(conductor.usuario_id) : null,
    correo: conductor.correo || null,
    nombre: conductor.nombre_apellidos || '',
  };
};

/**
 * Deja la notificación en la app (si el conductor tiene cuenta) y manda el correo (si tiene
 * correo). Ninguna de las dos cosas puede tumbar al llamador.
 * @private
 */
const _avisar = async ({ destinatario, titulo, mensaje, tipo, referenciaTabla, referenciaId, correo }) => {
  if (!destinatario) return;

  if (destinatario.usuarioId) {
    try {
      await notificacionRepo.create({
        usuario_id: destinatario.usuarioId,
        titulo: titulo.slice(0, 150),
        mensaje: mensaje.slice(0, 500),
        tipo,
        referencia_tabla: referenciaTabla,
        referencia_id: referenciaId,
      });
    } catch (error) {
      Logger.error('No se pudo crear la notificación del conductor', {
        usuario_id: destinatario.usuarioId,
        titulo,
        error: error.message,
      });
    }
  }

  if (destinatario.correo && correo) {
    await enviarSinBloquear(correo(destinatario.correo, destinatario.nombre), `${titulo} (${destinatario.correo})`);
  }
};

/**
 * El vehículo acaba de entrar. Recibe el registro_acceso ya guardado, con sus `vehiculo`,
 * `parqueadero` y `celda` anidados (entradaSalida.repository.findById).
 * @param {Object} registro
 */
const avisarIngreso = async (registro) => {
  try {
    const destinatario = await _destinatario({ conductorId: registro.conductor_id, vehiculoId: registro.vehiculo_id });
    if (!destinatario) return;

    const placa = registro.vehiculo?.placa || '';
    const parqueadero = registro.parqueadero?.nombre || '';
    const celda = registro.celda?.numero || null;
    const ingreso = new Date(registro.fecha_hora_ingreso);
    const hora = horaEnBogotaTexto(ingreso);
    const donde = [celda ? `celda ${celda}` : null, parqueadero || null].filter(Boolean).join(' · ');

    await _avisar({
      destinatario,
      titulo: `Tu vehículo ${placa} ingresó`.trim(),
      mensaje: `Ingreso registrado a las ${hora}${donde ? ` en ${donde}` : ''}.`,
      tipo: 'ACCESO',
      referenciaTabla: 'registro_acceso',
      referenciaId: registro.id,
      correo: (destino, nombre) =>
        enviarCorreoAcceso(destino, nombre, 'INGRESO', {
          placa,
          parqueadero,
          celda,
          horaIngreso: `${fechaEnBogotaTexto(ingreso)}, ${hora}`,
        }),
    });
  } catch (error) {
    Logger.error('No se pudo avisar el ingreso al conductor', { registro_id: registro?.id, error: error.message });
  }
};

/**
 * El vehículo acaba de salir. Recibe el registro_acceso ya cerrado (con fecha_hora_salida).
 * @param {Object} registro
 */
const avisarSalida = async (registro) => {
  try {
    const destinatario = await _destinatario({ conductorId: registro.conductor_id, vehiculoId: registro.vehiculo_id });
    if (!destinatario) return;

    const placa = registro.vehiculo?.placa || '';
    const parqueadero = registro.parqueadero?.nombre || '';
    const celda = registro.celda?.numero || null;
    const ingreso = new Date(registro.fecha_hora_ingreso);
    const salida = new Date(registro.fecha_hora_salida || Date.now());
    const permanencia = duracionTexto(ingreso, salida);

    await _avisar({
      destinatario,
      titulo: `Tu vehículo ${placa} salió`.trim(),
      mensaje: `Salida registrada a las ${horaEnBogotaTexto(salida)}. Estuvo ${permanencia}${celda ? ` en la celda ${celda}` : ''}${parqueadero ? ` (${parqueadero})` : ''}.`,
      tipo: 'ACCESO',
      referenciaTabla: 'registro_acceso',
      referenciaId: registro.id,
      correo: (destino, nombre) =>
        enviarCorreoAcceso(destino, nombre, 'SALIDA', {
          placa,
          parqueadero,
          celda,
          horaIngreso: `${fechaEnBogotaTexto(ingreso)}, ${horaEnBogotaTexto(ingreso)}`,
          horaSalida: `${fechaEnBogotaTexto(salida)}, ${horaEnBogotaTexto(salida)}`,
          permanencia,
        }),
    });
  } catch (error) {
    Logger.error('No se pudo avisar la salida al conductor', { registro_id: registro?.id, error: error.message });
  }
};

const TITULOS_RESERVA = {
  PENDIENTE: 'Recibimos tu solicitud de reserva',
  ACEPTADA: 'Tu reserva fue aceptada',
  RECHAZADA: 'Tu reserva fue rechazada',
  CANCELADA: 'Tu reserva fue cancelada',
};

/**
 * La reserva se creó o cambió de estado. Se avisa solo de lo que le importa al conductor:
 * que la recibimos, que se aceptó, o que ya no está (rechazada/cancelada) y por qué.
 * @param {Object} reserva - Fila de reserva (con conductor_id, celda_id, fechas).
 * @param {'PENDIENTE'|'ACEPTADA'|'RECHAZADA'|'CANCELADA'} estado
 * @param {string} [motivo]
 */
const avisarReserva = async (reserva, estado, motivo) => {
  if (!TITULOS_RESERVA[estado]) return;
  try {
    const destinatario = await _destinatario({ conductorId: reserva.conductor_id, vehiculoId: reserva.vehiculo_id });
    if (!destinatario) return;

    const celda = reserva.celda_id ? await celdaRepo.findById(reserva.celda_id) : null;
    const parqueadero = celda?.parqueadero ? await parqRepo.findById(celda.parqueadero) : null;
    const vehiculo = reserva.vehiculo_id ? await vehRepo.findById(reserva.vehiculo_id) : null;
    const inicio = new Date(reserva.fecha_hora_inicio);
    const fin = new Date(reserva.fecha_hora_fin);
    const franja = `${horaEnBogotaTexto(inicio)} a ${horaEnBogotaTexto(fin)}`;
    const donde = [celda?.numero ? `celda ${celda.numero}` : null, parqueadero?.nombre || null].filter(Boolean).join(' · ');

    await _avisar({
      destinatario,
      titulo: TITULOS_RESERVA[estado],
      mensaje: `${fechaEnBogotaTexto(inicio)}, ${franja}${donde ? ` · ${donde}` : ''}${motivo ? ` · Motivo: ${motivo}` : ''}.`,
      tipo: 'RESERVA',
      referenciaTabla: 'reserva',
      referenciaId: reserva.id,
      correo: (destino, nombre) =>
        enviarCorreoReserva(destino, nombre, estado, {
          fecha: fechaEnBogotaTexto(inicio),
          hora: franja,
          parqueadero: parqueadero?.nombre,
          celda: celda?.numero,
          placa: vehiculo?.placa,
          motivo,
        }),
    });
  } catch (error) {
    Logger.error('No se pudo avisar la reserva al conductor', { reserva_id: reserva?.id, estado, error: error.message });
  }
};

module.exports = { avisarIngreso, avisarSalida, avisarReserva };
