const db = require('../config/database');

const findAll = async () => {
  const [rows] = await db.query('SELECT * FROM parqueadero');
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM parqueadero WHERE id = ?', [id]);
  return rows[0] || null;
};

const findByNombre = async (nombre) => {
  const [rows] = await db.query('SELECT * FROM parqueadero WHERE nombre = ?', [nombre]);
  return rows[0] || null;
};

const create = async ({ nombre, ubicacion, descripcion }) => {
  const [result] = await db.query(
    'INSERT INTO parqueadero (nombre, ubicacion, descripcion) VALUES (?, ?, ?)',
    [nombre, ubicacion || null, descripcion || null]
  );
  return findById(result.insertId);
};

const update = async (id, { nombre, ubicacion, descripcion, estado }) => {
  await db.query(
    'UPDATE parqueadero SET nombre=?, ubicacion=?, descripcion=?, estado=? WHERE id=?',
    [nombre, ubicacion || null, descripcion || null, estado ?? 1, id]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM parqueadero WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByNombre, create, update, remove };
