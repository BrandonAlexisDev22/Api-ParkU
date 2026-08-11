/**
 * @module DbContext
 * @description La base de datos audita e historia sola vía triggers (fn_auditoria_generica,
 * fn_historial_celda, fn_historial_parqueadero, fn_historial_reserva), pero exige que cada
 * escritura declare quién la hizo dentro de la MISMA transacción:
 *   SET LOCAL app.usuario_id = '<id>'
 * Si falta, el trigger lanza una excepción de Postgres (ver cabecera de database/parku.postgres).
 * Las tablas que lo requieren son: celda, parqueadero, registro_acceso, reserva y vehiculo.
 * parqueadero además exige SET LOCAL app.motivo cuando cambia su columna 'estado'.
 *
 * Este helper abre la transacción, fija esas variables de sesión y ejecuta el trabajo dentro
 * de ella para que los repositorios solo tengan que pasar `{ transaction }` a Sequelize.
 */

const { sequelize } = require('../config/database');

/**
 * @param {number|string} usuarioId - ID del usuario autenticado (req.usuario.id).
 * @param {(transaction: import('sequelize').Transaction) => Promise<any>} work
 * @param {Object} [opciones]
 * @param {string} [opciones.motivo] - Obligatorio por la BD al cambiar parqueadero.estado.
 * @returns {Promise<any>}
 */
const runWithUsuario = async (usuarioId, work, { motivo } = {}) => {
  if (!usuarioId) {
    throw { status: 401, message: 'Esta operación requiere un usuario autenticado.' };
  }

  return sequelize.transaction(async (transaction) => {
    await sequelize.query('SET LOCAL app.usuario_id = :usuarioId', {
      replacements: { usuarioId: String(usuarioId) },
      transaction,
    });

    if (motivo) {
      await sequelize.query('SET LOCAL app.motivo = :motivo', {
        replacements: { motivo },
        transaction,
      });
    }

    return work(transaction);
  });
};

module.exports = { runWithUsuario };
