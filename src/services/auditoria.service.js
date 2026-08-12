/**
 * @module AuditoriaService
 * @description Lectura del rastro de auditoría (quién cambió qué y cuándo), poblado
 * solo por la BD vía trigger fn_auditoria_generica.
 */

const repo = require('../repositories/auditoria.repository');

const getAll = (filtros) => repo.findAll(filtros);

const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Registro de auditoría no encontrado' };
  return item;
};

module.exports = { getAll, getById };
