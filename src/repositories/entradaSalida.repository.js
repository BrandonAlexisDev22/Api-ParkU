const db = require('../config/database');

const BASE_QUERY = `
  SELECT es.id, es.tipo, es.descripcion, es.fecha_hora,
         c.id  AS celda_id,
         p.nombre AS parqueadero_nombre,
         v.id  AS vehiculo_id, v.placa
  FROM EntradaSalida es
  LEFT JOIN celda c        ON es.celda    = c.id
  LEFT JOIN parqueadero p  ON c.parqueadero = p.id
  LEFT JOIN vehiculo v     ON es.vehiculo = v.id
`;

const findAll = async () => {
  const [rows] = await db.query(`${BASE_QUERY} ORDER BY es.fecha_hora DESC`);
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE es.id = ?`, [id]);
  return rows[0] || null;
};

const findByVehiculo = async (vehiculoId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE es.vehiculo = ? ORDER BY es.fecha_hora DESC`,
    [vehiculoId]
  );
  return rows;
};

const findByFecha = async (desde, hasta) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE es.fecha_hora BETWEEN ? AND ? ORDER BY es.fecha_hora DESC`,
    [desde, hasta]
  );
  return rows;
};

const create = async ({ tipo, celda, vehiculo, descripcion }) => {
  const [result] = await db.query(
    'INSERT INTO EntradaSalida (tipo, celda, vehiculo, descripcion) VALUES (?, ?, ?, ?)',
    [tipo, celda || null, vehiculo || null, descripcion || null]
  );
  return findById(result.insertId);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM EntradaSalida WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByVehiculo, findByFecha, create, remove };
