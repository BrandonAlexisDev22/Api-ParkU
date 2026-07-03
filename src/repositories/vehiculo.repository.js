/**
 * @module VehiculoRepository
 * @description Capa de acceso a datos para la tabla 'vehiculo'.
 * Alineado con el modelo Vehiculo (conductor, placa, tipo, marca, modelo, anio, color, descripcion, estado).
 */

const db = require('../config/database');

/**
 * Consulta base que recupera los datos del vehículo y el nombre del propietario
 * navegando a través de la tabla de conductores hasta la de usuarios.
 * @constant {string}
 */
const BASE_QUERY = `
  SELECT v.*, u.nombre AS conductor_nombre
  FROM vehiculo v
  JOIN conductor c ON v.conductor = c.id
  JOIN usuario u   ON c.usuario   = u.id
`;

/**
 * Obtiene el listado completo de vehículos con su contexto de propietario.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const [rows] = await db.query(`${BASE_QUERY} ORDER BY v.placa`);
  return rows;
};

/**
 * Busca un vehículo por su ID interno.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE v.id = ?`, [id]);
  return rows[0] || null;
};

/**
 * Busca un vehículo por su placa (identificador único externo).
 * @param {string} placa 
 * @returns {Promise<Object|null>}
 */
const findByPlaca = async (placa) => {
  const [rows] = await db.query('SELECT * FROM vehiculo WHERE placa = ?', [placa]);
  return rows[0] || null;
};

/**
 * Recupera todos los vehículos registrados bajo un mismo conductor.
 * @param {number} conductorId 
 * @returns {Promise<Array>}
 */
const findByConductor = async (conductorId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE v.conductor = ? ORDER BY v.placa`,
    [conductorId]
  );
  return rows;
};

/**
 * Registra un nuevo vehículo en la base de datos.
 * @param {Object} data - { conductor, placa, tipo, marca, modelo, anio, color, descripcion, estado? }
 * @returns {Promise<Object>} El vehículo creado con los datos de su propietario.
 */
const create = async ({ conductor, placa, tipo, marca, modelo, anio, color, descripcion, estado = true }) => {
  const [result] = await db.query(
    `INSERT INTO vehiculo (conductor, placa, tipo, marca, modelo, anio, color, descripcion, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      conductor,
      placa,
      tipo || null,
      marca || null,
      modelo || null,
      anio || null,
      color || null,
      descripcion || null,
      estado ? 1 : 0
    ]
  );
  return findById(result.insertId);
};

/**
 * Actualiza parcialmente un vehículo existente.
 * @param {number} id 
 * @param {Object} data - Campos a actualizar (todos opcionales).
 * @returns {Promise<Object>}
 */
const update = async (id, data) => {
  const fields = [];
  const values = [];
  const allowedFields = ['conductor', 'placa', 'tipo', 'marca', 'modelo', 'anio', 'color', 'descripcion', 'estado'];
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`);
      // Convertir estado booleano a 0/1
      values.push(field === 'estado' ? (data[field] ? 1 : 0) : data[field]);
    }
  }
  if (fields.length === 0) {
    return findById(id);
  }
  values.push(id);
  const query = `UPDATE vehiculo SET ${fields.join(', ')} WHERE id = ?`;
  await db.query(query, values);
  return findById(id);
};

/**
 * Elimina un vehículo del sistema.
 * @param {number} id 
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM vehiculo WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByPlaca, findByConductor, create, update, remove };