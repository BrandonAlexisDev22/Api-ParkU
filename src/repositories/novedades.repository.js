/**
 * @module NovedadesRepository
 * @description Capa de acceso a datos para la tabla 'novedades'.
 * Gestiona incidentes, novedades y evidencias asociadas a vehículos y movimientos.
 */

const db = require('../config/database');

/**
 * Consulta base con JOIN para obtener contexto del vehículo y movimiento.
 * @constant {string}
 */
const BASE_QUERY = `
  SELECT n.*,
         v.placa AS vehiculo_placa,
         CONCAT(u.nombre, ' (', u.correo, ')') AS encargado_nombre,
         CONCAT('Movimiento #', n.ingreso_salida) AS movimiento_info
  FROM novedades n
  LEFT JOIN vehiculo v        ON n.vehiculo = v.id
  LEFT JOIN ingreso_salida is ON n.ingreso_salida = is.id
  LEFT JOIN usuario u         ON n.encargado = u.id  -- asumiendo que encargado es ID de usuario
`;

/**
 * Obtiene todas las novedades, ordenadas por fecha descendente.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const [rows] = await db.query(`${BASE_QUERY} ORDER BY n.fecha_hora DESC`);
  return rows;
};

/**
 * Busca una novedad por su ID.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.query(`${BASE_QUERY} WHERE n.id = ?`, [id]);
  return rows[0] || null;
};

/**
 * Filtra novedades por vehículo.
 * @param {number} vehiculoId 
 * @returns {Promise<Array>}
 */
const findByVehiculo = async (vehiculoId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE n.vehiculo = ? ORDER BY n.fecha_hora DESC`,
    [vehiculoId]
  );
  return rows;
};

/**
 * Filtra novedades por movimiento (ingreso_salida).
 * @param {number} movimientoId 
 * @returns {Promise<Array>}
 */
const findByMovimiento = async (movimientoId) => {
  const [rows] = await db.query(
    `${BASE_QUERY} WHERE n.ingreso_salida = ? ORDER BY n.fecha_hora DESC`,
    [movimientoId]
  );
  return rows;
};

/**
 * Filtra novedades por tipo y/o prioridad.
 * @param {Object} filtros - { tipo, prioridad, estado }
 * @returns {Promise<Array>}
 */
const findByFiltros = async ({ tipo, prioridad, estado }) => {
  let query = BASE_QUERY + ' WHERE 1=1';
  const params = [];
  if (tipo) {
    query += ' AND n.tipo_novedad = ?';
    params.push(tipo);
  }
  if (prioridad) {
    query += ' AND n.prioridad = ?';
    params.push(prioridad);
  }
  if (estado !== undefined) {
    query += ' AND n.estado = ?';
    params.push(estado ? 1 : 0);
  }
  query += ' ORDER BY n.fecha_hora DESC';
  const [rows] = await db.query(query, params);
  return rows;
};

/**
 * Crea una nueva novedad.
 * @param {Object} data - { vehiculo, encargado, descripcion, evidencia, ingreso_salida, tipo_novedad, prioridad, estado? }
 * @param {number|null} data.vehiculo
 * @param {number|null} data.encargado - ID del usuario encargado
 * @param {string} data.descripcion
 * @param {string|null} data.evidencia
 * @param {number|null} data.ingreso_salida
 * @param {string} data.tipo_novedad - DAÑO, ACCIDENTE, MAL_ESTACIONAMIENTO, QUEJA, OTRO
 * @param {string} data.prioridad - BAJA, MEDIA, ALTA, CRITICA
 * @param {boolean} [data.estado=true] - true = pendiente, false = resuelta
 * @returns {Promise<Object>}
 */
const create = async ({
  vehiculo,
  encargado,
  descripcion,
  evidencia,
  ingreso_salida,
  tipo_novedad = 'OTRO',
  prioridad = 'MEDIA',
  estado = true,
  fecha_hora = new Date()
}) => {
  const [result] = await db.query(
    `INSERT INTO novedades 
     (vehiculo, encargado, descripcion, evidencia, ingreso_salida, tipo_novedad, prioridad, estado, fecha_hora)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      vehiculo || null,
      encargado || null,
      descripcion,
      evidencia || null,
      ingreso_salida || null,
      tipo_novedad,
      prioridad,
      estado ? 1 : 0,
      fecha_hora
    ]
  );
  return findById(result.insertId);
};

/**
 * Actualiza parcialmente una novedad.
 * @param {number} id 
 * @param {Object} data - Campos a actualizar (todos opcionales)
 * @returns {Promise<Object>}
 */
const update = async (id, data) => {
  const fields = [];
  const values = [];
  const allowedFields = ['vehiculo', 'encargado', 'descripcion', 'evidencia', 'ingreso_salida', 'tipo_novedad', 'prioridad', 'estado'];
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(field === 'estado' ? (data[field] ? 1 : 0) : data[field]);
    }
  }
  if (fields.length === 0) {
    return findById(id);
  }
  values.push(id);
  const query = `UPDATE novedades SET ${fields.join(', ')} WHERE id = ?`;
  await db.query(query, values);
  return findById(id);
};

/**
 * Elimina una novedad.
 * @param {number} id 
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const [result] = await db.query('DELETE FROM novedades WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = {
  findAll,
  findById,
  findByVehiculo,
  findByMovimiento,
  findByFiltros,
  create,
  update,
  remove,
};