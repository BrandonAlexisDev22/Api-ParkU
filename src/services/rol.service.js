const repo = require('../repositories/rol.repository');

const getAll = () => repo.findAll();

const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Rol no encontrado' };
  return item;
};

const create = async (nombre) => {
  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };
  const existe = await repo.findByNombre(nombre);
  if (existe) throw { status: 409, message: 'Ya existe un rol con ese nombre' };
  return repo.create(nombre);
};

const update = async (id, nombre) => {
  await getById(id);
  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };
  const dup = await repo.findByNombre(nombre);
  if (dup && dup.id != id) throw { status: 409, message: 'Ya existe un rol con ese nombre' };
  return repo.update(id, nombre);
};

const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, create, update, remove };
