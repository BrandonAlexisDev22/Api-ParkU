/**
 * @module EvidenciaNovedadService
 * @description Adjuntos (fotos, video, documentos, notas) de una novedad.
 */

const { sequelize } = require('../config/database');
const repo = require('../repositories/evidenciaNovedad.repository');
const novedadesSvc = require('../services/novedades.service');

const TIPOS_PERMITIDOS = ['FOTO', 'VIDEO', 'DOCUMENTO', 'NOTA'];
const MAX_EVIDENCIAS_POR_NOVEDAD = 3;

// Las evidencias cuelgan de la novedad: quien no puede ver la novedad (no es gestor y no
// es suya) tampoco puede ver ni adjuntar evidencias -- ver novedades.service.
const getByNovedad = async (novedadId, solicitante) => {
  await novedadesSvc.exigirNovedadAccesible(novedadId, solicitante);
  return repo.findByNovedad(novedadId);
};

/**
 * Adjunta una evidencia a una novedad. Máximo 3 por novedad (0/1/2/3 permitido, la 4ª se
 * rechaza) -- el conteo y la inserción van en una transacción para acotar la ventana de
 * carrera de dos subidas simultáneas.
 * @throws {Object} 404 si la novedad no existe; 400 si faltan/son inválidos url o tipo;
 *   409 si la novedad ya tiene 3 evidencias.
 */
const create = async (novedadId, { url, tipo = 'FOTO', descripcion }, solicitante) => {
  await novedadesSvc.exigirNovedadAccesible(novedadId, solicitante);
  if (!url) throw { status: 400, message: 'La url es requerida' };
  if (!TIPOS_PERMITIDOS.includes(tipo)) {
    throw { status: 400, message: `Tipo inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }

  return sequelize.transaction(async (transaction) => {
    const existentes = await repo.findByNovedad(novedadId, { transaction });
    if (existentes.length >= MAX_EVIDENCIAS_POR_NOVEDAD) {
      throw { status: 409, message: `Una novedad no puede tener más de ${MAX_EVIDENCIAS_POR_NOVEDAD} evidencias` };
    }
    return repo.create({ novedad_id: novedadId, url, tipo, descripcion }, { transaction });
  });
};

const remove = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Evidencia no encontrada' };
  return repo.remove(id);
};

module.exports = { getByNovedad, create, remove };
