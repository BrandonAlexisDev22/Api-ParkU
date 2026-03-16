/**
 * @module ReservaRepository
 * @description Capa de persistencia para la gestión de reservas de celdas.
 * Implementa lógica compleja de validación de traslape de horarios.
 */

const db = require('../config/database');

/**
 * Consulta base que reconstruye el contexto de la reserva (Vehículo, Celda y Sede).
 * @constant {string}
 */
const BASE_QUERY = `
  SELECT r.*, v.placa,
         c.id  AS celda_id,
         p.nombre AS parqueadero_nombre
  FROM reserva r
  LEFT JOIN vehiculo v     ON r.vehiculo = v.id
  LEFT JOIN celda c        ON r.celda    = c.id
  LEFT JOIN parqueadero p  ON c.parqueadero = p.id
`;

/**
 * Recupera todas las reservas ordenadas cronológicamente por inicio.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const [rows] = await db.query(`${BASE_QUERY} ORDER BY r.fechaHora_inicio DESC`);
  return rows;
};

/**
 * Busca una reserva específica por su ID.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE r.id = ?`, [id]);
  return rows[0] || null;
};

/**
 * Obtiene el historial de reservas de un vehículo.
 * @param {number} vehiculoId 
 * @returns {Promise<Array>}
 */
const findByVehiculo = async (vehiculoId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE r.vehiculo = ? ORDER BY r.fechaHora_inicio DESC`,
    [vehiculoId]
  );
  return rows;
};

/**
 * Obtiene la agenda de reservas de una celda específica.
 * @param {number} celdaId 
 * @returns {Promise<Array>}
 */
const findByCelda = async (celdaId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE r.celda = ? ORDER BY r.fechaHora_inicio DESC`,
    [celdaId]
  );
  return rows;
};

/**
 * Detecta conflictos de horario para una celda.
 * Utiliza lógica de exclusión para encontrar cualquier traslape temporal.
 * @param {number} celdaId - ID de la celda a verificar.
 * @param {string} inicio - Fecha/Hora de inicio deseada.
 * @param {string} fin - Fecha/Hora de fin deseada.
 * @param {number|null} [excludeId] - ID de reserva a ignorar (útil en actualizaciones).
 * @returns {Promise<Array>} Lista de reservas que colisionan con el rango dado.
 */
const findConflictos = async (celdaId, inicio, fin, excludeId = null) => {
  let query = `
    SELECT * FROM reserva
    WHERE celda = ?
      AND NOT (fechaHora_fin <= ? OR fechaHora_inicio >= ?)
  `;
  const params = [celdaId, inicio, fin];
  
  if (excludeId) { 
    query += ' AND id != ?'; 
    params.push(excludeId); 
  }
  
  const [rows] = await db.query(query, params);
  return rows;
};

/**
 * Crea una nueva reserva en el sistema.
 * @param {Object} data - { celda, vehiculo, fechaHora_inicio, fechaHora_fin }
 * @returns {Promise<Object>} La reserva creada con sus joins.
 */
const create = async ({ celda, vehiculo, fechaHora_inicio, fechaHora_fin }) => {
  const [result] = await db.query(
    'INSERT INTO reserva (celda, vehiculo, fechaHora_inicio, fechaHora_fin) VALUES (?, ?, ?, ?)',
    [celda || null, vehiculo || null, fechaHora_inicio, fechaHora_fin]
  );
  return findById(result.insertId);
};

/**
 * Actualiza los datos o el horario de una reserva.
 * @param {number} id 
 * @param {Object} data - { celda, vehiculo, fechaHora_inicio, fechaHora_fin }
 * @returns {Promise<Object>}
 */
const update = async (id, { celda, vehiculo, fechaHora_inicio, fechaHora_fin }) => {
  await db.query(
    'UPDATE reserva SET celda=?, vehiculo=?, fechaHora_inicio=?, fechaHora_fin=? WHERE id=?',
    [celda || null, vehiculo || null, fechaHora_inicio, fechaHora_fin, id]
  );
  return findById(id);
};

/**
 * Elimina una reserva del sistema.
 * @param {number} id 
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM reserva WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByVehiculo, findByCelda, findConflictos, create, update, remove };