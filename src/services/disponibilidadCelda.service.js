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
