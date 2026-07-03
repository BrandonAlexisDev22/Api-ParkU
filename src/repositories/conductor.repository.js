/**
 * @module ConductorRepository
 * @description Operaciones de base de datos para la tabla 'conductor',
 * alineadas con el modelo Conductor (nombre, tipo_documento, documento,
 * licencia, correo, numero, perfil, estado).
 */

const db = require('../config/database');

/**
 * Consulta base para obtener todos los campos del modelo, incluyendo
 * el nombre del perfil (opcional) mediante JOIN.
 * @constant {string}
 */
const BASE_QUERY = `
  SELECT c.*, p.nombre AS perfil_nombre
  FROM conductor c
  LEFT JOIN perfil p ON c.perfil = p.id
`;

/**
 * Obtiene todos los conductores con sus datos y nombre de perfil.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const [rows] = await db.query(BASE_QUERY);
  return rows;
};

/**
 * Busca un conductor por su ID.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE c.id = ?`, [id]);
  return rows[0] || null;
};

/**
 * Busca conductores por número de documento (único).
 * @param {number} documento 
 * @returns {Promise<Object|null>}
 */
const findByDocumento = async (documento) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE c.documento = ?`, [documento]);
  return rows[0] || null;
};

/**
 * Busca conductores por correo electrónico.
 * @param {string} correo 
 * @returns {Promise<Array>}
 */
const findByCorreo = async (correo) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE c.correo = ?`, [correo]);
  return rows;
};

/**
 * Obtiene conductores activos (estado = true).
 * @returns {Promise<Array>}
 */
const findActivos = async () => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE c.estado = true`);
  return rows;
};

/**
 * Crea un nuevo conductor.
 * @param {Object} data - Datos del modelo (todos excepto id).
 * @param {string} data.nombre
 * @param {string} data.tipo_documento
 * @param {number} data.documento
 * @param {string|null} data.licencia
 * @param {string|null} data.correo
 * @param {string|null} data.numero
 * @param {number} data.perfil - ID del perfil.
 * @param {boolean} [data.estado=true] - Estado inicial.
 * @returns {Promise<Object>} Conductor creado con JOIN.
 */
const create = async ({ nombre, tipo_documento, documento, licencia, correo, numero, perfil, estado = true }) => {
  const [result] = await db.query(
    `INSERT INTO conductor 
     (nombre, tipo_documento, documento, licencia, correo, numero, perfil, estado) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre, tipo_documento, documento, licencia || null, correo || null, numero || null, perfil, estado ? 1 : 0]
  );
  return findById(result.insertId);
};

/**
 * Actualiza parcialmente un conductor.
 * @param {number} id 
 * @param {Object} data - Campos a actualizar (todos opcionales).
 * @param {string} [data.nombre]
 * @param {string} [data.tipo_documento]
 * @param {number} [data.documento]
 * @param {string} [data.licencia]
 * @param {string} [data.correo]
 * @param {string} [data.numero]
 * @param {number} [data.perfil]
 * @param {boolean} [data.estado]
 * @returns {Promise<Object>} Conductor actualizado.
 */
const update = async (id, data) => {
  const fields = [];
  const values = [];
  const allowedFields = ['nombre', 'tipo_documento', 'documento', 'licencia', 'correo', 'numero', 'perfil', 'estado'];
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`);
      // Convertir estado booleano a 0/1 para MySQL
      values.push(field === 'estado' ? (data[field] ? 1 : 0) : data[field]);
    }
  }
  if (fields.length === 0) {
    // Si no hay campos, devolvemos el registro sin cambios
    return findById(id);
  }
  values.push(id);
  const query = `UPDATE conductor SET ${fields.join(', ')} WHERE id = ?`;
  await db.query(query, values);
  return findById(id);
};

/**
 * Elimina un conductor (borrado físico).
 * @param {number} id 
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM conductor WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = {
  findAll,
  findById,
  findByDocumento,
  findByCorreo,
  findActivos,
  create,
  update,
  remove,
};