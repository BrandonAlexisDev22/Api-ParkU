/**
 * @module EvidenciaNovedadRepository
 * @description CRUD para 'evidencia_novedad' (adjuntos de una novedad).
 */

const { EvidenciaNovedad } = require('../models');

const findByNovedad = async (novedadId, { transaction } = {}) => {
  const rows = await EvidenciaNovedad.findAll({
    where: { novedad_id: novedadId },
    order: [['fecha_hora', 'DESC']],
    transaction,
  });
  return rows.map((r) => r.toJSON());
};

const findById = async (id, { transaction } = {}) => {
  const row = await EvidenciaNovedad.findByPk(id, { transaction });
  return row ? row.toJSON() : null;
};

const create = async (data, { transaction } = {}) => {
  const nueva = await EvidenciaNovedad.create(data, { transaction });
  return findById(nueva.id, { transaction });
};

const remove = async (id) => {
  const filasEliminadas = await EvidenciaNovedad.destroy({ where: { id } });
  return filasEliminadas > 0;
};

module.exports = { findByNovedad, findById, create, remove };
