const db = require('../config/database');

const BASE_QUERY = `
  SELECT c.*, p.nombre AS parqueadero_nombre
  FROM celda c
  JOIN parqueadero p ON c.parqueadero = p.id
`;

const findAll = async () => {
  const [rows] = await db.query(BASE_QUERY);
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE c.id = ?`, [id]);
  return rows[0] || null;
};

const findByParqueadero = async (parqueaderoId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE c.parqueadero = ?`, [parqueaderoId]
  );
  return rows;
};

const findDisponibles = async (parqueaderoId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE c.parqueadero = ? AND c.estado = 1`, [parqueaderoId]
  );
  return rows;
};

const create = async ({ parqueadero, discapacidad }) => {
  const [result] = await db.query(
    'INSERT INTO celda (parqueadero, discapacidad) VALUES (?, ?)',
    [parqueadero, discapacidad ? 1 : 0]
  );
  return findById(result.insertId);
};

const update = async (id, { discapacidad, estado }) => {
  await db.query(
    'UPDATE celda SET discapacidad = ?, estado = ? WHERE id = ?',
    [discapacidad ?? 0, estado ?? 1, id]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM celda WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByParqueadero, findDisponibles, create, update, remove };
