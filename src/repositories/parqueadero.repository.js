/**
 * @module ParqueaderoRepository
 * @description Operaciones de base de datos para la tabla 'parqueadero' usando Sequelize.
 * Toda escritura requiere contexto de usuario (auditoría/historial vía triggers); cambiar
 * 'estado' además exige un motivo -- ver parqueadero.service.js y dbContext.util.js.
 */

const { Parqueadero } = require('../models');

const CAMPOS_EDITABLES = [
  'nombre', 'ubicacion', 'acceso', 'capacidad_maxima', 'hora_apertura',
  'hora_cierre', 'zona', 'piso', 'plano_url', 'observaciones', 'descripcion', 'tipo',
];

/**
 * Busca un parqueadero por su nombre exacto.
 * @param {string} nombre
 * @returns {Promise<Object|null>}
 */
const findByNombre = async (nombre) => {
  const row = await Parqueadero.findOne({ where: { nombre } });
  return row ? row.toJSON() : null;
};

/**
 * Recupera todos los parqueaderos.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const rows = await Parqueadero.findAll({ order: [['nombre', 'ASC']] });
  return rows.map((r) => r.toJSON());
};

/**
 * Busca un parqueadero por su identificador.
 * @param {number} id
 * @param {import('sequelize').Transaction} [opciones.transaction] - Pasarla cuando se llama
 *   justo después de un create/update en la misma transacción: si no, esta lectura sale por
 *   otra conexión del pool y no ve la fila todavía sin confirmar (queda en null).
 * @returns {Promise<Object|null>}
 */
const findById = async (id, { transaction } = {}) => {
  const row = await Parqueadero.findByPk(id, { transaction });
  return row ? row.toJSON() : null;
};

/**
 * Igual que findById, pero bloqueando la fila (SELECT ... FOR UPDATE) dentro de la
 * transacción -- usado por cambiarEstado para serializar activaciones/desactivaciones
 * concurrentes del mismo parqueadero (dos administradores desactivando a la vez).
 * @param {number} id
 * @param {import('sequelize').Transaction} opciones.transaction
 * @returns {Promise<Object|null>}
 */
const findByIdConLock = async (id, { transaction }) => {
  const row = await Parqueadero.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  return row ? row.toJSON() : null;
};

/**
 * Crea un nuevo parqueadero.
 * @param {Object} data
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<Object>}
 */
const create = async (data, { transaction } = {}) => {
  const nuevo = await Parqueadero.create(data, { transaction });
  return findById(nuevo.id, { transaction });
};

/**
 * Actualiza los datos de un parqueadero (no toca 'estado'; usar cambiarEstado).
 * @param {number} id
 * @param {Object} data
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<Object>}
 */
const update = async (id, data, { transaction } = {}) => {
  const cambios = {};
  for (const field of CAMPOS_EDITABLES) {
    if (data[field] !== undefined) cambios[field] = data[field];
  }
  if (Object.keys(cambios).length === 0) {
    return findById(id, { transaction });
  }
  await Parqueadero.update(cambios, { where: { id }, transaction });
  return findById(id, { transaction });
};

/**
 * Activa/inactiva un parqueadero. La BD exige SET LOCAL app.motivo en la misma
 * transacción (fn_auditoria_generica lo valida solo para esta tabla).
 * @param {number} id
 * @param {boolean} estado
 * @param {import('sequelize').Transaction} opciones.transaction
 * @returns {Promise<Object>}
 */
const cambiarEstado = async (id, estado, { transaction } = {}) => {
  await Parqueadero.update({ estado }, { where: { id }, transaction });
  return findById(id, { transaction });
};

/**
 * Elimina un parqueadero.
 * @param {number} id
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<boolean>}
 */
const remove = async (id, { transaction } = {}) => {
  const filasEliminadas = await Parqueadero.destroy({ where: { id }, transaction });
  return filasEliminadas > 0;
};

module.exports = { findAll, findById, findByIdConLock, findByNombre, create, update, cambiarEstado, remove };
