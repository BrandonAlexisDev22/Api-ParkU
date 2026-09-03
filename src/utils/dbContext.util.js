/**
 * @module DbContext
 * @description La base de datos audita e historia sola vía triggers (fn_auditoria_generica,
 * fn_historial_celda, fn_historial_parqueadero, fn_historial_reserva, fn_sincronizar_disponibilidad),
 * pero exige que cada escritura declare quién la hizo dentro de la MISMA transacción:
 *   SET LOCAL app.usuario_id = '<id>'
 * Si falta, el trigger lanza una excepción de Postgres (ver cabecera de database/parku.postgres).
 * Las tablas que lo requieren son: celda, parqueadero, registro_acceso, reserva y vehiculo.
 * parqueadero además exige SET LOCAL app.motivo cuando cambia su columna 'estado', y
 * disponibilidad_celda exige SET LOCAL app.motivo_disponibilidad en toda escritura.
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
 * @param {string} [opciones.motivoDisponibilidad] - Obligatorio por la BD al escribir en disponibilidad_celda.
 * @returns {Promise<any>}
 */
const runWithUsuario = async (usuarioId, work, { motivo, motivoDisponibilidad } = {}) => {
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

    if (motivoDisponibilidad) {
      await sequelize.query('SET LOCAL app.motivo_disponibilidad = :motivoDisponibilidad', {
        replacements: { motivoDisponibilidad },
        transaction,
      });
    }

    return work(transaction);
  });
};

/**
 * Las reglas de negocio (celda ocupada, tipo de vehículo incorrecto, reserva
 * solapada, celda preferencial sin condición de movilidad reducida, etc.) las
 * valida la BD con RAISE EXCEPTION dentro de sus triggers, y las restricciones
 * de forma (placa duplicada, placa exigida salvo bicicleta, FKs...) con
 * CHECK/UNIQUE/FOREIGN KEY -- Sequelize envuelve todo eso como
 * SequelizeDatabaseError/SequelizeForeignKeyConstraintError con el código SQLSTATE
 * original en error.parent.code. Este helper los traduce a un error HTTP legible
 * en vez de dejar que caigan a un 500 genérico.
 * @param {Error} error
 * @throws {{status:number, message:string}}
 */
const traducirErrorTrigger = (error) => {
  const pgError = error?.parent || error?.original;
  switch (pgError?.code) {
    case 'P0001': // RAISE EXCEPTION en un trigger (regla de negocio)
      throw { status: 409, message: pgError.message };
    case '23505': // unique_violation
      throw { status: 409, message: 'Ya existe un registro con esos datos' };
    case '23503': // foreign_key_violation
      throw { status: 409, message: 'La operación hace referencia a datos que no existen o está referenciada por otros registros' };
    case '23514': // check_violation
      throw { status: 400, message: pgError.message };
    case '22001': // string_data_right_truncation (valor más largo que el límite de la columna)
      throw { status: 400, message: 'Uno de los valores enviados excede la longitud máxima permitida' };
    default:
      throw error;
  }
};

module.exports = { runWithUsuario, traducirErrorTrigger };
