const db = require('../config/database');

const BASE_QUERY = `
  SELECT rp.*, p.nombre AS parqueadero_nombre, v.placa
  FROM reporte rp
  LEFT JOIN parqueadero p ON rp.parqueadero = p.id
  LEFT JOIN vehiculo v    ON rp.vehiculo    = v.id
`;

const findAll = async () => {
  const [rows] = await db.query(`${BASE_QUERY} ORDER BY rp.fecha_hora DESC`);
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE rp.id = ?`, [id]);
  return rows[0] || null;
};

const findByParqueadero = async (parqueaderoId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE rp.parqueadero = ? ORDER BY rp.fecha_hora DESC`,
    [parqueaderoId]
  );
  return rows;
};

const create = async ({ descripcion, parqueadero, vehiculo, evidencia }) => {
  const [result] = await db.query(
    'INSERT INTO reporte (descripcion, parqueadero, vehiculo, evidencia) VALUES (?, ?, ?, ?)',
    [descripcion || null, parqueadero || null, vehiculo || null, evidencia || null]
  );
  return findById(result.insertId);
};

const update = async (id, { descripcion, estado }) => {
  await db.query(
    'UPDATE reporte SET descripcion = ?, estado = ? WHERE id = ?',
    [descripcion || null, estado ?? 1, id]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM reporte WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByParqueadero, create, update, remove };
