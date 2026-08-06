/**
 * @module CentroFormacionRepository
 * @description Operaciones de base de datos para la tabla 'centro_formacion' usando Sequelize.
 */

const { CentroFormacion, RegionalFormacion } = require('../models');

const includeRegional = { model: RegionalFormacion, as: 'regionalFormacion', attributes: ['nombre'] };

const mapCentro = (instancia) => {
  if (!instancia) return null;
  const plano = instancia.toJSON();
  const { regionalFormacion, ...resto } = plano;
  return { ...resto, regional_formacion_nombre: regionalFormacion ? regionalFormacion.nombre : null };
};

const findAll = async (regionalFormacionId) => {
  const where = regionalFormacionId ? { regional_formacion_id: regionalFormacionId } : undefined;
  const rows = await CentroFormacion.findAll({ where, include: [includeRegional], order: [['nombre', 'ASC']] });
  return rows.map(mapCentro);
};

const findById = async (id) => {
  const row = await CentroFormacion.findByPk(id, { include: [includeRegional] });
  return mapCentro(row);
};

module.exports = { findAll, findById };
