const repo        = require('../repositories/conductor.repository');
const usuarioRepo = require('../repositories/usuario.repository');

const getAll = () => repo.findAll();

const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Conductor no encontrado' };
  return item;
};

const create = async ({ usuario, perfil, discapacidad }) => {
  if (!usuario) throw { status: 400, message: 'El campo usuario es requerido' };
  const usuarioExiste = await usuarioRepo.findById(usuario);
  if (!usuarioExiste) throw { status: 404, message: 'Usuario no encontrado' };
  const yaEsConductor = await repo.findByUsuario(usuario);
  if (yaEsConductor) throw { status: 409, message: 'Este usuario ya tiene un perfil de conductor' };
  return repo.create({ usuario, perfil, discapacidad });
};

const update = async (id, datos) => {
  await getById(id);
  return repo.update(id, datos);
};

const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, create, update, remove };
