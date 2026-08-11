/**
 * @module NotificacionRepository
 * @description Lectura y marcado de notificaciones. Se insertan solas vía
 * fn_notificar_administradores() (triggers de novedad/reserva); la API no las crea.
 */

const { Notificacion } = require('../models');

/**
 * Notificaciones de un usuario, más recientes primero.
 * @param {number} usuarioId
 * @param {Object} [filtros]
 * @param {boolean} [filtros.soloNoLeidas]
 * @returns {Promise<Array>}
 */
const findByUsuario = async (usuarioId, { soloNoLeidas = false } = {}) => {
  const where = { usuario_id: usuarioId };
  if (soloNoLeidas) where.leida = false;
  const rows = await Notificacion.findAll({ where, order: [['fecha_hora', 'DESC']] });
  return rows.map((r) => r.toJSON());
};

const findById = async (id) => {
  const row = await Notificacion.findByPk(id);
  return row ? row.toJSON() : null;
};

/**
 * Marca una notificación como leída (o no leída).
 * @param {number} id
 * @param {boolean} [leida=true]
 * @returns {Promise<Object>}
 */
const marcarLeida = async (id, leida = true) => {
  await Notificacion.update({ leida }, { where: { id } });
  return findById(id);
};

/**
 * Marca todas las notificaciones de un usuario como leídas.
 * @param {number} usuarioId
 * @returns {Promise<number>} Cantidad de filas afectadas.
 */
const marcarTodasLeidas = async (usuarioId) => {
  const [afectadas] = await Notificacion.update(
    { leida: true },
    { where: { usuario_id: usuarioId, leida: false } }
  );
  return afectadas;
};

module.exports = { findByUsuario, findById, marcarLeida, marcarTodasLeidas };
