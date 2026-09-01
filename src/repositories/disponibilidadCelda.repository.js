/**
 * @module DisponibilidadCeldaRepository
 * @description Escritura del cambio MANUAL de disponibilidad de una celda. celda_id es
 * UNIQUE (una fila vigente por celda): si ya existe, se actualiza; si no, se crea. El
 * trigger fn_sincronizar_disponibilidad copia el resultado a celda.estado y registra
 * historial_disponibilidad_celda -- exige SET LOCAL app.usuario_id y
 * app.motivo_disponibilidad, ver disponibilidadCelda.service.js y dbContext.util.js.
 */

const { DisponibilidadCelda, HistorialDisponibilidadCelda, Celda, Usuario } = require('../models');

/**
 * Estado de disponibilidad vigente de una celda (si alguna vez tuvo un cambio manual).
 * @param {number} celdaId
 * @param {import('sequelize').Transaction} [opciones.transaction] - Pasarla cuando se llama
 *   justo después de un create/update en la misma transacción: si no, esta lectura sale por
 *   otra conexión del pool y no ve la fila todavía sin confirmar (queda en null).
 * @returns {Promise<Object|null>}
 */
const findByCelda = async (celdaId, { transaction } = {}) => {
  const row = await DisponibilidadCelda.findOne({
    where: { celda_id: celdaId },
    include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }],
    transaction,
  });
  return row ? row.toJSON() : null;
};

/**
 * Crea o actualiza la fila de disponibilidad de una celda (upsert por celda_id único).
 * @param {number} celdaId
 * @param {Object} data - { estado, motivo, observacion, usuario_id }
 * @param {import('sequelize').Transaction} opciones.transaction
 * @returns {Promise<Object>}
 */
const upsert = async (celdaId, { estado, motivo, observacion, usuario_id }, { transaction } = {}) => {
  const existente = await DisponibilidadCelda.findOne({ where: { celda_id: celdaId }, transaction });

  if (existente) {
    await existente.update({ estado, motivo, observacion: observacion || null, usuario_id }, { transaction });
  } else {
    await DisponibilidadCelda.create(
      { celda_id: celdaId, estado, motivo, observacion: observacion || null, usuario_id },
      { transaction },
    );
  }

  return findByCelda(celdaId, { transaction });
};

/**
 * Histórico de cambios de disponibilidad de una celda, más reciente primero.
 * @param {number} celdaId
 * @returns {Promise<Array>}
 */
const findHistorialPorCelda = async (celdaId) => {
  const rows = await HistorialDisponibilidadCelda.findAll({
    where: { celda_id: celdaId },
    include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }],
    order: [['fecha_hora', 'DESC']],
  });
  return rows.map((r) => r.toJSON());
};

module.exports = { findByCelda, upsert, findHistorialPorCelda };
