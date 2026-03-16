const repo     = require('../repositories/rolPermiso.repository');
const rolRepo  = require('../repositories/rol.repository');
const permRepo = require('../repositories/permiso.repository');

const getAll = () => repo.findAll();

const getByRol = (rolId) => repo.findByRol(rolId);

const create = async (rol, permiso) => {
  if (!rol || !permiso) throw { status: 400, message: 'rol y permiso son requeridos' };
  const rolExiste  = await rolRepo.findById(rol);
  if (!rolExiste)  throw { status: 404, message: 'Rol no encontrado' };
  const permExiste = await permRepo.findById(permiso);
  if (!permExiste) throw { status: 404, message: 'Permiso no encontrado' };
  return repo.create(rol, permiso);
};

const remove = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Registro no encontrado' };
  return repo.remove(id);
};

module.exports = { getAll, getByRol, create, remove };
