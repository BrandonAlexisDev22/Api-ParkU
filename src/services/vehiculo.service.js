const repo          = require('../repositories/vehiculo.repository');
const conductorRepo = require('../repositories/conductor.repository');

const getAll = () => repo.findAll();

const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Vehículo no encontrado' };
  return item;
};

const getByConductor = (conductorId) => repo.findByConductor(conductorId);

const create = async (datos) => {
  if (!datos.conductor || !datos.placa)
    throw { status: 400, message: 'conductor y placa son requeridos' };
  const conductorExiste = await conductorRepo.findById(datos.conductor);
  if (!conductorExiste) throw { status: 404, message: 'Conductor no encontrado' };
  const placaExiste = await repo.findByPlaca(datos.placa);
  if (placaExiste) throw { status: 409, message: 'La placa ya está registrada' };
  return repo.create(datos);
};

const update = async (id, datos) => {
  await getById(id);
  if (datos.placa) {
    const dup = await repo.findByPlaca(datos.placa);
    if (dup && dup.id != id) throw { status: 409, message: 'La placa ya está registrada' };
  }
  return repo.update(id, datos);
};

const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, getByConductor, create, update, remove };
