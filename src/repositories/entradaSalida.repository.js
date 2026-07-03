/**
 * @module IngresoSalidaRepository
 * @description Capa de persistencia para el registro de movimientos de vehículos.
 * Alineado con el modelo IngresoSalida (tipo, vehiculo, celda, descripcion, fecha_hora).
 */

const db = require('../config/database');

/**
 * Consulta base que obtiene todos los campos del modelo y datos relacionados
 * (parqueadero y placa del vehículo) mediante JOINs.
 * @constant {string}
 */
const BASE_QUERY = `
  SELECT es.*,
         p.nombre AS parqueadero_nombre,
         v.placa  AS vehiculo_placa
  FROM ingreso_salida es
  LEFT JOIN celda c       ON es.celda = c.id
  LEFT JOIN parqueadero p ON c.parqueadero = p.id
  LEFT JOIN vehiculo v    ON es.vehiculo = v.id
`;

/**
 * Recupera todo el historial de movimientos, ordenado del más reciente al más antiguo.
 * @returns {Promise<Array>} Lista de objetos con todos los campos del modelo + extras.
 */
const findAll = async () => {
  const [rows] = await db.query(`${BASE_QUERY} ORDER BY es.fecha_hora DESC`);
  return rows;
};

/**
 * Obtiene un registro de movimiento específico.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE es.id = ?`, [id]);
  return rows[0] || null;
};

/**
 * Obtiene el historial de movimientos de un vehículo en particular.
 * @param {number} vehiculoId 
 * @returns {Promise<Array>}
 */
const findByVehiculo = async (vehiculoId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE es.vehiculo = ? ORDER BY es.fecha_hora DESC`,
    [vehiculoId]
  );
  return rows;
};

/**
 * Busca registros dentro de un rango de tiempo específico.
 * @param {string} desde - Fecha inicial (YYYY-MM-DD o ISO)
 * @param {string} hasta - Fecha final (YYYY-MM-DD o ISO)
 * @returns {Promise<Array>}
 */
const findByFecha = async (desde, hasta) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE es.fecha_hora BETWEEN ? AND ? ORDER BY es.fecha_hora DESC`,
    [desde, hasta]
  );
  return rows;
};

/**
 * Registra una nueva acción de entrada o salida.
 * @param {Object} data - Datos del movimiento.
 * @param {string} data.tipo - 'INGRESO' o 'SALIDA'.
 * @param {number} data.vehiculo - ID del vehículo.
 * @param {number} data.celda - ID de la celda.
 * @param {string|null} [data.descripcion] - Observaciones opcionales.
 * @param {Date|string} [data.fecha_hora] - Fecha/hora personalizada (opcional, si no se envía se asigna automáticamente en la BD).
 * @returns {Promise<Object>} El registro creado con todos sus datos relacionados.
 */
const create = async ({ tipo, vehiculo, celda, descripcion, fecha_hora }) => {
  let query = 'INSERT INTO ingreso_salida (tipo, vehiculo, celda, descripcion';
  const values = [tipo, vehiculo, celda, descripcion || null];
  
  if (fecha_hora) {
    query += ', fecha_hora) VALUES (?, ?, ?, ?, ?)';
    values.push(fecha_hora);
  } else {
    query += ') VALUES (?, ?, ?, ?)';
  }

  const [result] = await db.query(query, values);
  return findById(result.insertId);
};

/**
 * Elimina un registro del historial (uso administrativo/corrección).
 * @param {number} id 
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM ingreso_salida WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByVehiculo, findByFecha, create, remove };