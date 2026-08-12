/**
 * @module NotificacionService
 * @description Lectura y marcado de notificaciones del usuario autenticado. Se
 * insertan solas vía fn_notificar_administradores() (triggers de novedad/reserva);
 * este service no expone creación.
 */

const repo = require('../repositories/notificacion.repository');

/**
 * Notificaciones del usuario autenticado.
 * @param {number} usuarioId
 * @param {boolean} [soloNoLeidas=false]
 * @returns {Promise<Array>}
 */
const getMisNotificaciones = (usuarioId, soloNoLeidas = false) => repo.findByUsuario(usuarioId, { soloNoLeidas });

/**
 * Marca una notificación como leída, validando que sea del usuario autenticado.
 * @param {number} id
 * @param {number} usuarioId
 * @throws {Object} 404 si no existe o no pertenece al usuario.
 * @returns {Promise<Object>}
 */
const marcarLeida = async (id, usuarioId) => {
  const notificacion = await repo.findById(id);
  if (!notificacion || notificacion.usuario_id !== Number(usuarioId)) {
    throw { status: 404, message: 'Notificación no encontrada' };
  }
  return repo.marcarLeida(id, true);
};

/**
 * Marca todas las notificaciones del usuario autenticado como leídas.
 * @param {number} usuarioId
 * @returns {Promise<number>} Cantidad de notificaciones actualizadas.
 */
const marcarTodasLeidas = (usuarioId) => repo.marcarTodasLeidas(usuarioId);

module.exports = { getMisNotificaciones, marcarLeida, marcarTodasLeidas };
