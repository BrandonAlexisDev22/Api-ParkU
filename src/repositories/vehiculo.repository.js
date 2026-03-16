const db = require('../config/database');

const BASE_QUERY = `
  SELECT v.*, u.nombre AS conductor_nombre
  FROM vehiculo v
  JOIN conductor c ON v.conductor = c.id
  JOIN usuario u   ON c.usuario   = u.id
`;

const findAll = async () => {
  const [rows] = await db.query(BASE_QUERY);
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE v.id = ?`, [id]);
  return rows[0] || null;
};

const findByPlaca = async (placa) => {
  const [rows] = await db.query('SELECT * FROM vehiculo WHERE placa = ?', [placa]);
  return rows[0] || null;
};

const findByConductor = async (conductorId) => {
  const [rows] = await db.query('SELECT * FROM vehiculo WHERE conductor = ?', [conductorId]);
  return rows;
};

const create = async ({ conductor, placa, tipo, marca, modelo, anio, color, descripcion }) => {
  const [result] = await db.query(
    `INSERT INTO vehiculo (conductor, placa, tipo, marca, modelo, anio, color, descripcion)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [conductor, placa, tipo || null, marca || null, modelo || null,
     anio || null, color || null, descripcion || null]
  );
  return findById(result.insertId);
};

const update = async (id, { tipo, marca, modelo, anio, color, descripcion, estado }) => {
  await db.query(
    `UPDATE vehiculo SET tipo=?, marca=?, modelo=?, anio=?, color=?, descripcion=?, estado=?
     WHERE id = ?`,
    [tipo || null, marca || null, modelo || null, anio || null,
     color || null, descripcion || null, estado ?? 1, id]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM vehiculo WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByPlaca, findByConductor, create, update, remove };
