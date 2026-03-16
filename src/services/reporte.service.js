const repo      = require('../repositories/reporte.repository');
const parqRepo  = require('../repositories/parqueadero.repository');
const vehRepo   = require('../repositories/vehiculo.repository');

const getAll = () => repo.findAll();

const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Reporte no encontrado' };
  return item;
};

const getByParqueadero = (parqueaderoId) => repo.findByParqueadero(parqueaderoId);

const create = async ({ descripcion, parqueadero, vehiculo, evidencia }) => {
  if (parqueadero) {
    const p = await parqRepo.findById(parqueadero);
    if (!p) throw { status: 404, message: 'Parqueadero no encontrado' };
  }
  if (vehiculo) {
    const v = await vehRepo.findById(vehiculo);
    if (!v) throw { status: 404, message: 'Vehículo no encontrado' };
  }
  return repo.create({ descripcion, parqueadero, vehiculo, evidencia });
};

const update = async (id, datos) => {
  await getById(id);
  return repo.update(id, datos);
};

const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, getByParqueadero, create, update, remove };
