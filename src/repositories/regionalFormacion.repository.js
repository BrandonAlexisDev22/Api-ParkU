/**
 * @module RegionalFormacionRepository
 * @description Operaciones de base de datos para la tabla 'regional_formacion' usando Sequelize.
 */

const { RegionalFormacion } = require('../models');

const findAll = async () => {
  const rows = await RegionalFormacion.findAll({ order: [['nombre', 'ASC']] });
  return rows.map((r) => r.toJSON());
};

const findById = async (id) => {
  const row = await RegionalFormacion.findByPk(id);
  return row ? row.toJSON() : null;
};

module.exports = { findAll, findById };
