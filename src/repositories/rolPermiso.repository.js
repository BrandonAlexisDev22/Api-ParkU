const db = require('../config/database');

const findAll = async () => {
  const [rows] = await db.query(`
    SELECT rp.id, r.id AS rol_id, r.nombre AS rol_nombre,
           p.id AS permiso_id, p.nombre AS permiso_nombre
    FROM rol_permiso rp
    JOIN rol r     ON rp.rol     = r.id
    JOIN permiso p ON rp.permiso = p.id
  `);
  return rows;
};

const findByRol = async (rolId) => {
  const [rows] = await db.query(`
    SELECT rp.id, p.id AS permiso_id, p.nombre AS permiso_nombre
    FROM rol_permiso rp
    JOIN permiso p ON rp.permiso = p.id
    WHERE rp.rol = ?
  `, [rolId]);
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM rol_permiso WHERE id = ?', [id]);
  return rows[0] || null;
};

const create = async (rol, permiso) => {
  const [result] = await db.query(
    'INSERT INTO rol_permiso (rol, permiso) VALUES (?, ?)',
    [rol, permiso]
  );
  return findById(result.insertId);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM rol_permiso WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findByRol, findById, create, remove };
