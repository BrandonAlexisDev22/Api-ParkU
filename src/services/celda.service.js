const repo          = require('../repositories/celda.repository');
const parqRepo      = require('../repositories/parqueadero.repository');

const getAll = () => repo.findAll();

const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Celda no encontrada' };
  return item;
};

const getByParqueadero = (parqueaderoId) => repo.findByParqueadero(parqueaderoId);

const getDisponibles = (parqueaderoId) => repo.findDisponibles(parqueaderoId);

const create = async ({ parqueadero, discapacidad }) => {
  if (!parqueadero) throw { status: 400, message: 'El parqueadero es requerido' };
  const existe = await parqRepo.findById(parqueadero);
  if (!existe) throw { status: 404, message: 'Parqueadero no encontrado' };
  return repo.create({ parqueadero, discapacidad });
};

const update = async (id, datos) => {
  await getById(id);
  return repo.update(id, datos);
};

const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, getByParqueadero, getDisponibles, create, update, remove };
