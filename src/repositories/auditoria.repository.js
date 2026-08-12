/**
 * @module AuditoriaRepository
 * @description Lectura de 'auditoria'. Se llena sola vía trigger fn_auditoria_generica.
 */

const { Op } = require('sequelize');
const { Auditoria, Usuario } = require('../models');

const includeUsuario = { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo'] };

/**
 * @param {Object} [filtros]
 * @param {string} [filtros.tabla_afectada]
 * @param {number} [filtros.registro_id]
 * @param {number} [filtros.usuario_id]
 * @param {string} [filtros.desde]
 * @param {string} [filtros.hasta]
 * @returns {Promise<Array>}
 */
const findAll = async ({ tabla_afectada, registro_id, usuario_id, desde, hasta } = {}) => {
  const where = {};
  if (tabla_afectada) where.tabla_afectada = tabla_afectada;
  if (registro_id) where.registro_id = registro_id;
  if (usuario_id) where.usuario_id = usuario_id;
  if (desde || hasta) {
    where.fecha_hora = {};
    if (desde) where.fecha_hora[Op.gte] = desde;
    if (hasta) where.fecha_hora[Op.lte] = hasta;
  }

  const rows = await Auditoria.findAll({ where, include: [includeUsuario], order: [['fecha_hora', 'DESC']] });
  return rows.map((r) => r.toJSON());
};

/**
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const row = await Auditoria.findByPk(id, { include: [includeUsuario] });
  return row ? row.toJSON() : null;
};

module.exports = { findAll, findById };
