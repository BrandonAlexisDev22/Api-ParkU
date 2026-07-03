/**
 * @module CeldaRepository
 * @description Operaciones de base de datos para la tabla 'celda',
 * alineadas con el modelo Celda (tipo, usabilidad, estado_celda).
 * Incluye JOIN con parqueadero para obtener el nombre de la sede.
 */

const db = require('../config/database');

/**
 * Consulta base que une celda con parqueadero.
 * @constant {string}
 */
const BASE_QUERY = `
  SELECT c.*, p.nombre AS parqueadero_nombre
  FROM celda c
  JOIN parqueadero p ON c.parqueadero = p.id
`;

/**
 * Recupera todas las celdas del sistema.
 * @returns {Promise<Array>} Listado de celdas con datos del parqueadero.
 */
const findAll = async () => {
  const [rows] = await db.query(BASE_QUERY);
  return rows;
};

/**
 * Busca una celda por su identificador.
 * @param {number} id 
 * @returns {Promise<Object|null>} Objeto con los campos del modelo o null.
 */
const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE c.id = ?`, [id]);
  return rows[0] || null;
};

/**
 * Obtiene todas las celdas de un parqueadero específico.
 * @param {number} parqueaderoId 
 * @returns {Promise<Array>}
 */
const findByParqueadero = async (parqueaderoId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE c.parqueadero = ?`,
    [parqueaderoId]
  );
  return rows;
};

/**
 * Filtra celdas disponibles (estado_celda = 'DISPONIBLE') en un parqueadero.
 * @param {number} parqueaderoId 
 * @returns {Promise<Array>}
 */
const findDisponibles = async (parqueaderoId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE c.parqueadero = ? AND c.estado_celda = 'DISPONIBLE'`,
    [parqueaderoId]
  );
  return rows;
};

/**
 * Crea una nueva celda en la base de datos.
 * @param {Object} data - Datos de la celda.
 * @param {number} data.parqueadero - ID del parqueadero.
 * @param {string} data.tipo - Tipo de celda (CARRO, MOTO, MOVILIDAD_REDUCIDA, BICICLETA).
 * @param {string} data.usabilidad - Usabilidad (GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA).
 * @param {string} [data.estado_celda='DISPONIBLE'] - Estado inicial (DISPONIBLE, OCUPADO, MANTENIMIENTO, INACTIVA).
 * @returns {Promise<Object>} La celda recién creada (con nombre del parqueadero).
 */
const create = async ({ parqueadero, tipo, usabilidad, estado_celda = 'DISPONIBLE' }) => {
  const [result] = await db.query(
    'INSERT INTO celda (parqueadero, tipo, usabilidad, estado_celda) VALUES (?, ?, ?, ?)',
    [parqueadero, tipo, usabilidad, estado_celda]
  );
  return findById(result.insertId);
};

/**
 * Actualiza parcialmente una celda existente.
 * @param {number} id - Identificador de la celda.
 * @param {Object} data - Campos a actualizar (todos opcionales).
 * @param {string} [data.tipo] - Nuevo tipo.
 * @param {string} [data.usabilidad] - Nueva usabilidad.
 * @param {string} [data.estado_celda] - Nuevo estado.
 * @returns {Promise<Object>} La celda actualizada (con nombre del parqueadero).
 */
const update = async (id, { tipo, usabilidad, estado_celda }) => {
  // Construir dinámicamente la cláusula SET solo con los campos proporcionados
  const fields = [];
  const values = [];
  if (tipo !== undefined) {
    fields.push('tipo = ?');
    values.push(tipo);
  }
  if (usabilidad !== undefined) {
    fields.push('usabilidad = ?');
    values.push(usabilidad);
  }
  if (estado_celda !== undefined) {
    fields.push('estado_celda = ?');
    values.push(estado_celda);
  }

  if (fields.length === 0) {
    // Si no se envía ningún campo, devolvemos la celda sin cambios
    return findById(id);
  }

  values.push(id);
  const query = `UPDATE celda SET ${fields.join(', ')} WHERE id = ?`;
  await db.query(query, values);
  return findById(id);
};

/**
 * Elimina una celda de la base de datos.
 * @param {number} id 
 * @returns {Promise<boolean>} True si se eliminó algún registro.
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM celda WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findByParqueadero, findDisponibles, create, update, remove };