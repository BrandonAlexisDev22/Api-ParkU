const db = require('../config/database');

const findAll = async () => {
  const [rows] = await db.query('SELECT * FROM permiso');
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM permiso WHERE id = ?', [id]);
  return rows[0] || null;
};

const findByNombre = async (nombre) => {
  const [rows] = await db.query('SELECT * FROM permiso WHERE nombre = ?', [nombre]);
  return rows[0] || null;
};

const create = async (nombre) => {
  const [result] = await db.query('INSERT INTO permiso (nombre) VALUES (?)', [nombre]);
  return findById(result.insertId);
};

const update = async (id, nombre) => {
  await db.query('UPDATE permiso SET nombre = ? WHERE id = ?', [nombre, id]);
  return findById(id);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM permiso WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByNombre, create, update, remove };
