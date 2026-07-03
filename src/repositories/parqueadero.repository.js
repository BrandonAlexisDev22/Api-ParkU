/**
 * @module ParqueaderoRepository
 * @description Capa de acceso a datos para la tabla 'parqueadero'.
 * Alineado con el modelo Parqueadero (nombre, ubicacion, celdas_totales,
 * celdas_movilidad_reducida, celdas_motos, celdas_carros, estado).
 */

const db = require('../config/database');

/**
 * Consulta base (simple, sin JOINs).
 * @constant {string}
 */
const BASE_QUERY = 'SELECT * FROM parqueadero';

/**
 * Obtiene todas las sedes registradas, ordenadas por nombre.
 * @returns {Promise<Array>} Lista de parqueaderos.
 */
const findAll = async () => {
  const [rows] = await db.query(`${BASE_QUERY} ORDER BY nombre`);
  return rows;
};

/**
 * Busca una sede por su ID único.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE id = ?`, [id]);
  return rows[0] || null;
};

/**
 * Busca una sede por nombre exacto (útil para validaciones de duplicidad).
 * @param {string} nombre 
 * @returns {Promise<Object|null>}
 */
const findByNombre = async (nombre) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE nombre = ?`, [nombre]);
  return rows[0] || null;
};

/**
 * Inserta una nueva sede en el sistema.
 * @param {Object} data - Datos del parqueadero.
 * @param {string} data.nombre
 * @param {string|null} data.ubicacion
 * @param {number} data.celdas_totales
 * @param {number} data.celdas_movilidad_reducida
 * @param {number} data.celdas_motos
 * @param {number} data.celdas_carros
 * @param {boolean} [data.estado=true]
 * @returns {Promise<Object>} La sede recién creada.
 */
const create = async ({
  nombre,
  ubicacion,
  celdas_totales,
  celdas_movilidad_reducida,
  celdas_motos,
  celdas_carros,
  estado = true
}) => {
  const [result] = await db.query(
    `INSERT INTO parqueadero 
     (nombre, ubicacion, celdas_totales, celdas_movilidad_reducida, celdas_motos, celdas_carros, estado) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      nombre,
      ubicacion || null,
      celdas_totales,
      celdas_movilidad_reducida,
      celdas_motos,
      celdas_carros,
      estado ? 1 : 0
    ]
  );
  return findById(result.insertId);
};

/**
 * Actualiza parcialmente una sede existente.
 * @param {number} id 
 * @param {Object} data - Campos a actualizar (todos opcionales).
 * @param {string} [data.nombre]
 * @param {string} [data.ubicacion]
 * @param {number} [data.celdas_totales]
 * @param {number} [data.celdas_movilidad_reducida]
 * @param {number} [data.celdas_motos]
 * @param {number} [data.celdas_carros]
 * @param {boolean} [data.estado]
 * @returns {Promise<Object>} La sede actualizada.
 */
const update = async (id, data) => {
  const fields = [];
  const values = [];
  const allowedFields = [
    'nombre',
    'ubicacion',
    'celdas_totales',
    'celdas_movilidad_reducida',
    'celdas_motos',
    'celdas_carros',
    'estado'
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`);
      // Convertir estado booleano a 0/1 para MySQL
      values.push(field === 'estado' ? (data[field] ? 1 : 0) : data[field]);
    }
  }

  if (fields.length === 0) {
    // Si no se envía ningún campo, devolvemos el registro sin cambios
    return findById(id);
  }

  values.push(id);
  const query = `UPDATE parqueadero SET ${fields.join(', ')} WHERE id = ?`;
  await db.query(query, values);
  return findById(id);
};

/**
 * Elimina una sede de la base de datos.
 * Nota: Puede fallar si hay celdas asociadas (integridad referencial).
 * @param {number} id 
 * @returns {Promise<boolean>} True si se eliminó algún registro.
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM parqueadero WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = {
  findAll,
  findById,
  findByNombre,
  create,
  update,
  remove,
};