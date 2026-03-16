import connection from "../config/database.js";

/**
 * Obtiene todas las asignaciones (entradas/salidas)
 * @returns {Promise<Array>}
 */
export const getAll = async () => {
  const [rows] = await connection.query(
    "SELECT * FROM EntradaSalida"
  );
  return rows;
};


/**
 * Busca una asignación por ID
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const getById = async (id) => {
  const [rows] = await connection.query(
    "SELECT * FROM EntradaSalida WHERE id = ?",
    [id]
  );
  return rows[0];
};


/**
 * Busca asignaciones por vehículo
 * @param {number} id_vehiculo
 * @returns {Promise<Array>}
 */
export const getByVehiculo = async (id_vehiculo) => {
  const [rows] = await connection.query(
    "SELECT * FROM EntradaSalida WHERE vehiculo = ?",
    [id_vehiculo]
  );
  return rows;
};


/**
 * Busca asignaciones por celda
 * @param {number} id_celda
 * @returns {Promise<Array>}
 */
export const getByCelda = async (id_celda) => {
  const [rows] = await connection.query(
    "SELECT * FROM EntradaSalida WHERE celda = ?",
    [id_celda]
  );
  return rows;
};


/**
 * Crea una nueva asignación (entrada o salida)
 * @param {Object} data
 * @param {string} data.tipo
 * @param {number} data.celda
 * @param {number} data.vehiculo
 * @param {string} data.descripcion
 * @returns {Promise<Object>}
 */
export const create = async (data) => {

  const { tipo, celda, vehiculo, descripcion } = data;

  const [result] = await connection.query(
    `INSERT INTO EntradaSalida (tipo, celda, vehiculo, descripcion)
     VALUES (?, ?, ?, ?)`,
    [tipo, celda, vehiculo, descripcion]
  );

  return {
    id: result.insertId,
    ...data
  };
};


/**
 * Edita una asignación
 * @param {number} id
 * @param {Object} data
 */
export const editById = async (id, data) => {

  const { tipo, celda, vehiculo, descripcion } = data;

  const [result] = await connection.query(
    `UPDATE EntradaSalida 
     SET tipo = ?, celda = ?, vehiculo = ?, descripcion = ?
     WHERE id = ?`,
    [tipo, celda, vehiculo, descripcion, id]
  );

  return result;
};


/**
 * Elimina una asignación
 * @param {number} id
 */
export const deleteById = async (id) => {

  const [result] = await connection.query(
    "DELETE FROM EntradaSalida WHERE id = ?",
    [id]
  );

  return result;
};