/**
 * @module ReporteRepository
 * @description Capa de acceso a datos para la tabla 'reporte'.
 * Centraliza la gestión de incidentes, novedades y evidencias fotográficas.
 */

const db = require('../config/database');

/**
 * Consulta base con joins para obtener contexto del parqueadero y vehículo.
 * @constant {string}
 */
const BASE_QUERY = `
  SELECT rp.*, p.nombre AS parqueadero_nombre, v.placa
  FROM reporte rp
  LEFT JOIN parqueadero p ON rp.parqueadero = p.id
  LEFT JOIN vehiculo v     ON rp.vehiculo    = v.id
`;

/**
 * Obtiene todos los reportes, priorizando los más recientes.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const [rows] = await db.query(`${BASE_QUERY} ORDER BY rp.fecha_hora DESC`);
  return rows;
};

/**
 * Busca un reporte por su ID único.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE rp.id = ?`, [id]);
  return rows[0] || null;
};

/**
 * Filtra reportes por una sede específica.
 * @param {number} parqueaderoId 
 * @returns {Promise<Array>}
 */
const findByParqueadero = async (parqueaderoId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE rp.parqueadero = ? ORDER BY rp.fecha_hora DESC`,
    [parqueaderoId]
  );
  return rows;
};

/**
 * Registra una nueva novedad en el sistema.
 * @param {Object} data - { descripcion, parqueadero, vehiculo, evidencia }
 * @returns {Promise<Object>} El reporte creado con sus relaciones.
 */
const create = async ({ descripcion, parqueadero, vehiculo, evidencia }) => {
  const [result] = await db.query(
    'INSERT INTO reporte (descripcion, parqueadero, vehiculo, evidencia) VALUES (?, ?, ?, ?)',
    [descripcion || null, parqueadero || null, vehiculo || null, evidencia || null]
  );
  return findById(result.insertId);
};

/**
 * Actualiza el estado o la descripción de un reporte existente.
 * @param {number} id 
 * @param {Object} data - { descripcion, estado }
 * @returns {Promise<Object>}
 */
const update = async (id, { descripcion, estado }) => {
  await db.query(
    'UPDATE reporte SET descripcion = ?, estado = ? WHERE id = ?',
    [descripcion || null, estado ?? 1, id]
  );
  return findById(id);
};

/**
 * Elimina un reporte del sistema.
 * @param {number} id 
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM reporte WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByParqueadero, create, update, remove };