/**
 * @module TipoUsuarioRepository
 * @description Operaciones de base de datos para la tabla 'tipo_usuario' usando Sequelize.
 */

const { TipoUsuario } = require('../models');

const findAll = async () => {
  const rows = await TipoUsuario.findAll({ order: [['tipo_usuario', 'ASC']] });
  return rows.map((r) => r.toJSON());
};

const findById = async (id) => {
  const row = await TipoUsuario.findByPk(id);
  return row ? row.toJSON() : null;
};

module.exports = { findAll, findById };
