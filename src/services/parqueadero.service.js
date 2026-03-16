const repo = require('../repositories/parqueadero.repository');

const getAll = () => repo.findAll();

const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Parqueadero no encontrado' };
  return item;
};

const create = async ({ nombre, ubicacion, descripcion }) => {
  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };
  const existe = await repo.findByNombre(nombre);
  if (existe) throw { status: 409, message: 'Ya existe un parqueadero con ese nombre' };
  return repo.create({ nombre, ubicacion, descripcion });
};

const update = async (id, datos) => {
  await getById(id);
  if (datos.nombre) {
    const dup = await repo.findByNombre(datos.nombre);
    if (dup && dup.id != id) throw { status: 409, message: 'Ya existe un parqueadero con ese nombre' };
  }
  return repo.update(id, datos);
};

const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, create, update, remove };
