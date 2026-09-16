/**
 * @module OcupacionCeldaService
 * @description Lectura de quién ocupa (o ocupó) cada celda. Tabla poblada sola por
 * triggers de registro_acceso -- no hay creación/edición desde la API.
 */

const repo = require('../repositories/ocupacionCelda.repository');
const { resolverAlcance, exigir, acotar } = require('../utils/alcance.util');

// Quién ocupa cada celda (y desde cuándo) es información de operación del parqueadero:
// la ve quien lo gestiona. Cualquier otro rol solo ve las ocupaciones de sus vehículos.
const PERMISOS_GESTION = ['parqueaderos.gestionar', 'ingreso.gestionar', 'salida.gestionar'];

const getAll = async (solicitante) => {
  const alcance = await resolverAlcance(solicitante, PERMISOS_GESTION);
  return acotar(alcance, await repo.findAll(), (o) => alcance.esVehiculoPropio(o.vehiculo_id));
};

const getById = async (id, solicitante) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Ocupación no encontrada' };
  const alcance = await resolverAlcance(solicitante, PERMISOS_GESTION);
  exigir(alcance, alcance.esVehiculoPropio(item.vehiculo_id));
  return item;
};

const getByCelda = async (celdaId, solicitante) => {
  const alcance = await resolverAlcance(solicitante, PERMISOS_GESTION);
  return acotar(alcance, await repo.findByCelda(celdaId), (o) => alcance.esVehiculoPropio(o.vehiculo_id));
};

const getByVehiculo = async (vehiculoId, solicitante) => {
  const alcance = await resolverAlcance(solicitante, PERMISOS_GESTION);
  exigir(alcance, alcance.esVehiculoPropio(vehiculoId));
  return repo.findByVehiculo(vehiculoId);
};

module.exports = { getAll, getById, getByCelda, getByVehiculo };
