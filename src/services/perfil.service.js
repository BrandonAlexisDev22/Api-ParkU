const repo = require('../repositories/perfil.repository');

const getAll = () => repo.findAll();

const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Perfil no encontrado' };
  return item;
};

const create = async ({ nombre, descripcion }) => {
  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };
  return repo.create({ nombre, descripcion });
};

const update = async (id, datos) => {
  await getById(id);
  if (!datos.nombre) throw { status: 400, message: 'El nombre es requerido' };
  return repo.update(id, datos);
};

const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, create, update, remove };
