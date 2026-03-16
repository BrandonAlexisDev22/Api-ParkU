const db = require('../config/database');

const findAll = async () => {
  const [rows] = await db.query('SELECT * FROM perfil');
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM perfil WHERE id = ?', [id]);
  return rows[0] || null;
};

const create = async ({ nombre, descripcion }) => {
  const [result] = await db.query(
    'INSERT INTO perfil (nombre, descripcion) VALUES (?, ?)',
    [nombre, descripcion || null]
  );
  return findById(result.insertId);
};

const update = async (id, { nombre, descripcion }) => {
  await db.query(
    'UPDATE perfil SET nombre = ?, descripcion = ? WHERE id = ?',
    [nombre, descripcion || null, id]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM perfil WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, create, update, remove };
