const db = require('../config/database');

const findAll = async () => {
  const [rows] = await db.query(`
    SELECT u.id, u.correo, u.nombre, u.numero,
           r.id AS rol_id, r.nombre AS rol_nombre
    FROM usuario u
    LEFT JOIN rol r ON u.rol = r.id
  `);
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(`
    SELECT u.id, u.correo, u.nombre, u.numero,
           r.id AS rol_id, r.nombre AS rol_nombre
    FROM usuario u
    LEFT JOIN rol r ON u.rol = r.id
    WHERE u.id = ?
  `, [id]);
  return rows[0] || null;
};

const findByCorreo = async (correo) => {
  // Devuelve la fila completa (incluyendo contrasena) para auth
  const [rows] = await db.query('SELECT * FROM usuario WHERE correo = ?', [correo]);
  return rows[0] || null;
};

const create = async ({ correo, contrasena, nombre, numero, rol }) => {
  const [result] = await db.query(
    'INSERT INTO usuario (correo, contrasena, nombre, numero, rol) VALUES (?, ?, ?, ?, ?)',
    [correo, contrasena, nombre, numero || null, rol || null]
  );
  return findById(result.insertId);
};

const update = async (id, { nombre, numero, rol }) => {
  await db.query(
    'UPDATE usuario SET nombre = ?, numero = ?, rol = ? WHERE id = ?',
    [nombre, numero || null, rol || null, id]
  );
  return findById(id);
};

const updateContrasena = async (id, contrasena) => {
  await db.query('UPDATE usuario SET contrasena = ? WHERE id = ?', [contrasena, id]);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM usuario WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByCorreo, create, update, updateContrasena, remove };
