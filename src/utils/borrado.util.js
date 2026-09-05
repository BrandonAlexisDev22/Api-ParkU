/**
 * @module BorradoUtil
 * @description Comprueba si una ficha (cuenta, conductor, vehículo) tiene operaciones del
 * parqueadero colgando antes de borrarla.
 *
 * Las reglas de la base de datos (migración 005) ya impiden esos borrados por sí solas: esas
 * claves foráneas son ON DELETE RESTRICT. Pero un RESTRICT responde con el error crudo de
 * Postgres ("violates foreign key constraint..."), que sube como 500 y no le dice nada a
 * quien está mirando la pantalla. Esto se adelanta y responde un 409 que nombra exactamente
 * qué lo impide y con cuántos registros.
 *
 * Todo lo demás -- auditoría, historiales, notificaciones, vínculos de propiedad -- lo
 * resuelve la base de datos sola (SET NULL o CASCADE según el caso): no hay que limpiarlo a
 * mano, y por eso este módulo solo conoce las operaciones.
 */

const { sequelize } = require('../config/database');

/**
 * @param {Object} opciones
 * @param {Array<{tabla: string, columna: string, que_es: string}>} opciones.referencias -
 *   Las operaciones que bloquean, con el nombre en castellano para el mensaje.
 * @param {number} opciones.id - Id de la ficha que se quiere borrar.
 * @param {string} opciones.sujeto - Cómo nombrarla en el mensaje ("a Ana Martínez",
 *   "el vehículo ABC123"…).
 * @param {string} opciones.alternativa - Qué puede hacer en su lugar.
 * @param {boolean} [opciones.detallar=true] - Enumerar qué registros lo impiden. Se apaga
 *   cuando ese desglose no le dice nada a quien está mirando la pantalla: para un vehículo,
 *   saber que "hay información que lo necesita" basta, y el detalle sigue viajando en
 *   `data.bloqueos` por si hace falta.
 * @throws {Object} 409 con `data.bloqueos` para que el frontend pueda detallarlo.
 * @returns {Promise<void>}
 */
const exigirSinOperaciones = async ({ referencias, id, sujeto, alternativa, detallar = true }) => {
  const bloqueos = [];

  for (const referencia of referencias) {
    const [filas] = await sequelize.query(
      `SELECT count(*)::int AS n FROM ${referencia.tabla} WHERE ${referencia.columna} = :id`,
      { replacements: { id } },
    );
    if (filas[0].n > 0) bloqueos.push({ registro: referencia.que_es, cantidad: filas[0].n });
  }

  if (!bloqueos.length) return;

  const detalle = bloqueos.map((b) => `${b.cantidad} ${b.registro}`).join(', ');
  throw {
    status: 409,
    message: detallar
      ? `No se puede eliminar ${sujeto}: tiene ${detalle}. Ese historial es el registro de operación del parqueadero. ${alternativa}`
      : `No se puede eliminar ${sujeto}: hay información en los registros del parqueadero que lo necesita. ${alternativa}`,
    data: { bloqueos },
  };
};

module.exports = { exigirSinOperaciones };
