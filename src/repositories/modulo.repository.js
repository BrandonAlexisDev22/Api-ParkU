/**
 * @module ModuloRepository
 * @description Operaciones de base de datos para el catálogo 'modulo'.
 */

const { Modulo } = require('../models');

const findAll = async () => {
  const rows = await Modulo.findAll({ order: [['nombre', 'ASC']] });
  return rows.map((r) => r.toJSON());
};

const findById = async (id) => {
  const row = await Modulo.findByPk(id);
  return row ? row.toJSON() : null;
};

const findByNombre = async (nombre) => {
  const row = await Modulo.findOne({ where: { nombre } });
  return row ? row.toJSON() : null;
};

module.exports = { findAll, findById, findByNombre };
