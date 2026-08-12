/**
 * @module EvidenciaNovedadRepository
 * @description CRUD para 'evidencia_novedad' (adjuntos de una novedad).
 */

const { EvidenciaNovedad } = require('../models');

const findByNovedad = async (novedadId) => {
  const rows = await EvidenciaNovedad.findAll({
    where: { novedad_id: novedadId },
    order: [['fecha_hora', 'DESC']],
  });
  return rows.map((r) => r.toJSON());
};

const findById = async (id) => {
  const row = await EvidenciaNovedad.findByPk(id);
  return row ? row.toJSON() : null;
};

const create = async (data) => {
  const nueva = await EvidenciaNovedad.create(data);
  return findById(nueva.id);
};

const remove = async (id) => {
  const filasEliminadas = await EvidenciaNovedad.destroy({ where: { id } });
  return filasEliminadas > 0;
};

module.exports = { findByNovedad, findById, create, remove };
