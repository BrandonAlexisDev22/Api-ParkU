const db = require('../config/database');

const BASE_QUERY = `
  SELECT c.id, c.discapacidad,
         u.id AS usuario_id, u.nombre, u.correo, u.numero,
         p.id AS perfil_id, p.nombre AS perfil_nombre
  FROM conductor c
  JOIN usuario u     ON c.usuario = u.id
  LEFT JOIN perfil p ON c.perfil  = p.id
`;

const findAll = async () => {
  const [rows] = await db.query(BASE_QUERY);
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE c.id = ?`, [id]);
  return rows[0] || null;
};

const findByUsuario = async (usuarioId) => {
  const [rows] = await db.query('SELECT * FROM conductor WHERE usuario = ?', [usuarioId]);
  return rows[0] || null;
};

const create = async ({ usuario, perfil, discapacidad }) => {
  const [result] = await db.query(
    'INSERT INTO conductor (usuario, perfil, discapacidad) VALUES (?, ?, ?)',
    [usuario, perfil || null, discapacidad ? 1 : 0]
  );
  return findById(result.insertId);
};

const update = async (id, { perfil, discapacidad }) => {
  await db.query(
    'UPDATE conductor SET perfil = ?, discapacidad = ? WHERE id = ?',
    [perfil || null, discapacidad ? 1 : 0, id]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM conductor WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByUsuario, create, update, remove };
