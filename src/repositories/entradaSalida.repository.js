/**
 * @module EntradaSalidaRepository
 * @description Capa de persistencia para el registro de movimientos de vehículos.
 * Maneja la trazabilidad de ingresos y egresos vinculando celdas, sedes y vehículos.
 */

const db = require('../config/database');

/**
 * Consulta base con múltiples JOINs para reconstruir el historial completo.
 * @constant {string}
 */
const BASE_QUERY = `
  SELECT es.id, es.tipo, es.descripcion, es.fecha_hora,
         c.id  AS celda_id,
         p.nombre AS parqueadero_nombre,
         v.id  AS vehiculo_id, v.placa
  FROM EntradaSalida es
  LEFT JOIN celda c         ON es.celda     = c.id
  LEFT JOIN parqueadero p   ON c.parqueadero = p.id
  LEFT JOIN vehiculo v      ON es.vehiculo = v.id
`;

/**
 * Recupera todo el historial de movimientos, ordenado del más reciente al más antiguo.
 * @returns {Promise<Array>}
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
 * @param {string} desde - Fecha inicial (ISO o YYYY-MM-DD)
 * @param {string} hasta - Fecha final (ISO o YYYY-MM-DD)
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
 * @param {Object} data - { tipo, celda, vehiculo, descripcion }
 * @returns {Promise<Object>} El registro creado con todos sus datos relacionados.
 */
const create = async ({ tipo, celda, vehiculo, descripcion }) => {
  const [result] = await db.query(
    'INSERT INTO EntradaSalida (tipo, celda, vehiculo, descripcion) VALUES (?, ?, ?, ?)',
    [tipo, celda || null, vehiculo || null, descripcion || null]
  );
  return findById(result.insertId);
};

/**
 * Elimina un registro del historial (Uso administrativo/corrección).
 * @param {number} id 
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM EntradaSalida WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByVehiculo, findByFecha, create, remove };