/**
 * @module CatalogosService
 * @description Lectura de catálogos de referencia usados por el módulo de conductores:
 * tipo de usuario, regional/centro/programa de formación.
 */

const tipoUsuarioRepo = require('../repositories/tipoUsuario.repository');
const regionalFormacionRepo = require('../repositories/regionalFormacion.repository');
const centroFormacionRepo = require('../repositories/centroFormacion.repository');
const programaFormacionRepo = require('../repositories/programaFormacion.repository');

const getTiposUsuario = () => tipoUsuarioRepo.findAll();
const getRegionalesFormacion = () => regionalFormacionRepo.findAll();
const getCentrosFormacion = (regionalFormacionId) => centroFormacionRepo.findAll(regionalFormacionId);
const getProgramasFormacion = () => programaFormacionRepo.findAll();

module.exports = {
  getTiposUsuario,
  getRegionalesFormacion,
  getCentrosFormacion,
  getProgramasFormacion,
};
