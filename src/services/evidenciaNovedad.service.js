/**
 * @module EvidenciaNovedadService
 * @description Adjuntos (fotos, video, documentos, notas) de una novedad.
 */

const repo = require('../repositories/evidenciaNovedad.repository');
const novedadRepo = require('../repositories/novedades.repository');

const TIPOS_PERMITIDOS = ['FOTO', 'VIDEO', 'DOCUMENTO', 'NOTA'];

const getByNovedad = async (novedadId) => {
  const novedad = await novedadRepo.findById(novedadId);
  if (!novedad) throw { status: 404, message: 'Novedad no encontrada' };
  return repo.findByNovedad(novedadId);
};

const create = async (novedadId, { url, tipo = 'FOTO', descripcion }) => {
  const novedad = await novedadRepo.findById(novedadId);
  if (!novedad) throw { status: 404, message: 'Novedad no encontrada' };
  if (!url) throw { status: 400, message: 'La url es requerida' };
  if (!TIPOS_PERMITIDOS.includes(tipo)) {
    throw { status: 400, message: `Tipo inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }

  return repo.create({ novedad_id: novedadId, url, tipo, descripcion });
};

const remove = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Evidencia no encontrada' };
  return repo.remove(id);
};

module.exports = { getByNovedad, create, remove };
