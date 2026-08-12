/**
 * @module CatalogosService
 * @description Lectura del catálogo de referencia 'tipo_usuario', usado por el
 * módulo de conductores. regional/centro/programa de formación ya no son
 * catálogos con tabla propia: viven como texto libre en conductor.*.
 */

const tipoUsuarioRepo = require('../repositories/tipoUsuario.repository');

const getTiposUsuario = () => tipoUsuarioRepo.findAll();

module.exports = {
  getTiposUsuario,
};
