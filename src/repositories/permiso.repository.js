/**
 * @module PermisoRepository
 * @description Operaciones de base de datos para la tabla 'permiso' usando Sequelize.
 */

const { Permiso } = require('../models');

const findAll = async () => {
  const rows = await Permiso.findAll();
  return rows.map((r) => r.toJSON());
};

const findById = async (id) => {
  const row = await Permiso.findByPk(id);
  return row ? row.toJSON() : null;
};

const create = async ({ nombre }) => {
  const nuevo = await Permiso.create({ nombre });
  return findById(nuevo.id);
};

const update = async (id, { nombre }) => {
  if (nombre === undefined) return findById(id);
  await Permiso.update({ nombre }, { where: { id } });
  return findById(id);
};

const remove = async (id) => {
  const filasEliminadas = await Permiso.destroy({ where: { id } });
  return filasEliminadas > 0;
};

module.exports = { findAll, findById, create, update, remove };