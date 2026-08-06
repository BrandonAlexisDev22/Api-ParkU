/**
 * @module ProgramaFormacionRepository
 * @description Operaciones de base de datos para la tabla 'programa_formacion' usando Sequelize.
 */

const { ProgramaFormacion } = require('../models');

const findAll = async () => {
  const rows = await ProgramaFormacion.findAll({ order: [['nombre', 'ASC']] });
  return rows.map((r) => r.toJSON());
};

const findById = async (id) => {
  const row = await ProgramaFormacion.findByPk(id);
  return row ? row.toJSON() : null;
};

module.exports = { findAll, findById };
