/**
 * @module OcupacionCeldaService
 * @description Lectura de quién ocupa (o ocupó) cada celda. Tabla poblada sola por
 * triggers de registro_acceso -- no hay creación/edición desde la API.
 */

const repo = require('../repositories/ocupacionCelda.repository');

const getAll = () => repo.findAll();

const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Ocupación no encontrada' };
  return item;
};

const getByCelda = (celdaId) => repo.findByCelda(celdaId);

const getByVehiculo = (vehiculoId) => repo.findByVehiculo(vehiculoId);

module.exports = { getAll, getById, getByCelda, getByVehiculo };
