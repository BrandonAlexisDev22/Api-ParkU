/**
 * @module DisponibilidadCeldaService
 * @description Canal oficial para cambios MANUALES de disponibilidad de una celda
 * (mantenimiento, inactivación, reactivación). No usar para lo que ya hace la BD sola
 * (ingreso/salida de vehículos, reservas) -- para eso, celda.estado lo mueve el trigger
 * correspondiente. Esta escritura exige motivo (motivo_disponibilidad_enum) y queda
 * registrada en historial_disponibilidad_celda automáticamente.
 */

const repo = require('../repositories/disponibilidadCelda.repository');
const celdaRepo = require('../repositories/celda.repository');
const ocupacionRepo = require('../repositories/ocupacionCelda.repository');
const reservaRepo = require('../repositories/reserva.repository');
const { runWithUsuario, traducirErrorTrigger } = require('../utils/dbContext.util');

const ESTADOS_PERMITIDOS = ['DISPONIBLE', 'OCUPADA', 'RESERVADA', 'MANTENIMIENTO', 'INACTIVA'];
const MOTIVOS_PERMITIDOS = [
  'INGRESO_VEHICULO', 'SALIDA_VEHICULO', 'RESERVA', 'LIBERACION_RESERVA',
  'MANTENIMIENTO', 'DANIO', 'ERROR_ASIGNACION', 'AJUSTE_OPERATIVO', 'OTRO',
];

/**
 * Disponibilidad manual vigente de una celda.
 * @param {number} celdaId
 * @throws {Object} 404 si la celda no existe o nunca tuvo un cambio manual.
 * @returns {Promise<Object>}
 */
const getByCelda = async (celdaId) => {
  const item = await repo.findByCelda(celdaId);
  if (!item) throw { status: 404, message: 'La celda no tiene cambios de disponibilidad registrados' };
  return item;
};

/**
 * Histórico de cambios de disponibilidad de una celda.
 * @param {number} celdaId
 * @returns {Promise<Array>}
 */
const getHistorialPorCelda = (celdaId) => repo.findHistorialPorCelda(celdaId);

/**
 * Bloquea el cambio manual solo cuando la celda está REALMENTE en uso, no cuando su campo
 * estado lo diga.
 *
 *   estado OCUPADA + ocupacion_celda ACTIVA        -> bloquear (hay un vehículo dentro)
 *   estado OCUPADA + sin ocupación activa          -> permitir (estado desincronizado)
 *   estado RESERVADA + reserva ACEPTADA vigente    -> bloquear (hay una reserva en curso)
 *   estado RESERVADA + sin reserva vigente         -> permitir (reserva vencida/borrada)
 *
 * Reutiliza las consultas que ya existían (ocupacionCelda.findActivaPorCelda y
 * reserva.findConflictos) en vez de escribir queries nuevas.
 * @private
 * @param {Object} celda
 * @throws {Object} 409 si la celda está efectivamente en uso.
 */
const _validarUsoReal = async (celda) => {
  if (celda.estado === 'OCUPADA') {
    const ocupacion = await ocupacionRepo.findActivaPorCelda(celda.id);
    if (ocupacion) {
      throw {
        status: 409,
        message: `La celda ${celda.numero} tiene un vehículo estacionado; registra su salida antes de cambiar el estado manualmente`,
      };
    }
    return;
  }

  if (celda.estado === 'RESERVADA') {
    // Misma consulta que usa el ingreso (reserva.repository.findReservaQueBloquea), para
    // que "la celda está reservada para alguien" signifique exactamente lo mismo en los
    // dos sitios.
    const aceptada = await reservaRepo.findReservaQueBloquea(celda.id);
    if (aceptada) {
      throw {
        status: 409,
        message: `La celda ${celda.numero} tiene una reserva aceptada en curso (hasta ${new Date(aceptada.fecha_hora_fin).toISOString()}); cancélala o espera a que termine antes de cambiar el estado manualmente`,
      };
    }
  }
};

/**
 * Cambia manualmente el estado de una celda con motivo obligatorio.
 * @param {number} celdaId
 * @param {Object} data - { estado, motivo, observacion? }
 * @param {number} usuarioId - Usuario autenticado que hace el cambio.
 * @throws {Object} 400 si faltan/son inválidos estado o motivo; 404 si la celda no existe.
 * @returns {Promise<Object>}
 */
const cambiar = async (celdaId, { estado, motivo, observacion }, usuarioId) => {
  const celda = await celdaRepo.findById(celdaId);
  if (!celda) throw { status: 404, message: 'Celda no encontrada' };

  // El bloqueo NO se decide por el campo celda.estado sino por la relación real que ese
  // estado dice representar. Un estado puede quedar desincronizado (una ocupación cerrada
  // a mano, una reserva borrada, un ingreso que falló a medias) y dejaba la celda
  // congelada para siempre: el estado decía OCUPADA, no había vehículo, y el único camino
  // para arreglarlo era tocar la base de datos. Ahora solo bloquea lo que de verdad está
  // en uso, y una celda con estado colgado se puede corregir manualmente.
  await _validarUsoReal(celda);

  if (!estado || !ESTADOS_PERMITIDOS.includes(estado)) {
    throw { status: 400, message: `Estado inválido. Permitidos: ${ESTADOS_PERMITIDOS.join(', ')}` };
  }
  if (!motivo || !MOTIVOS_PERMITIDOS.includes(motivo)) {
    throw { status: 400, message: `Motivo inválido. Permitidos: ${MOTIVOS_PERMITIDOS.join(', ')}` };
  }

  try {
    return await runWithUsuario(
      usuarioId,
      (transaction) => repo.upsert(celdaId, { estado, motivo, observacion, usuario_id: usuarioId }, { transaction }),
      { motivoDisponibilidad: motivo },
    );
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

module.exports = { getByCelda, getHistorialPorCelda, cambiar };
