const db = require('../config/database');

const BASE_QUERY = `
  SELECT r.*, v.placa,
         c.id  AS celda_id,
         p.nombre AS parqueadero_nombre
  FROM reserva r
  LEFT JOIN vehiculo v     ON r.vehiculo = v.id
  LEFT JOIN celda c        ON r.celda    = c.id
  LEFT JOIN parqueadero p  ON c.parqueadero = p.id
`;

const findAll = async () => {
  const [rows] = await db.query(`${BASE_QUERY} ORDER BY r.fechaHora_inicio DESC`);
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE r.id = ?`, [id]);
  return rows[0] || null;
};

const findByVehiculo = async (vehiculoId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE r.vehiculo = ? ORDER BY r.fechaHora_inicio DESC`,
    [vehiculoId]
  );
  return rows;
};

const findByCelda = async (celdaId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE r.celda = ? ORDER BY r.fechaHora_inicio DESC`,
    [celdaId]
  );
  return rows;
};

// Detecta conflictos de horario en la misma celda
const findConflictos = async (celdaId, inicio, fin, excludeId = null) => {
  let query = `
    SELECT * FROM reserva
    WHERE celda = ?
      AND NOT (fechaHora_fin <= ? OR fechaHora_inicio >= ?)
  `;
  const params = [celdaId, inicio, fin];
  if (excludeId) { query += ' AND id != ?'; params.push(excludeId); }
  const [rows] = await db.query(query, params);
  return rows;
};

const create = async ({ celda, vehiculo, fechaHora_inicio, fechaHora_fin }) => {
  const [result] = await db.query(
    'INSERT INTO reserva (celda, vehiculo, fechaHora_inicio, fechaHora_fin) VALUES (?, ?, ?, ?)',
    [celda || null, vehiculo || null, fechaHora_inicio, fechaHora_fin]
  );
  return findById(result.insertId);
};

const update = async (id, { celda, vehiculo, fechaHora_inicio, fechaHora_fin }) => {
  await db.query(
    'UPDATE reserva SET celda=?, vehiculo=?, fechaHora_inicio=?, fechaHora_fin=? WHERE id=?',
    [celda || null, vehiculo || null, fechaHora_inicio, fechaHora_fin, id]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM reserva WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByVehiculo, findByCelda, findConflictos, create, update, remove };
