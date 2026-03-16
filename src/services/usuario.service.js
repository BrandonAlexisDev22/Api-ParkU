const bcrypt = require('bcryptjs');
const repo   = require('../repositories/usuario.repository');

const getAll = () => repo.findAll();

const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Usuario no encontrado' };
  return item;
};

const create = async ({ correo, contrasena, nombre, numero, rol }) => {
  if (!correo || !contrasena || !nombre)
    throw { status: 400, message: 'correo, contrasena y nombre son requeridos' };
  const existe = await repo.findByCorreo(correo);
  if (existe) throw { status: 409, message: 'El correo ya está registrado' };
  const hash = await bcrypt.hash(contrasena, 10);
  return repo.create({ correo, contrasena: hash, nombre, numero, rol });
};

const update = async (id, datos) => {
  await getById(id);
  return repo.update(id, datos);
};

const cambiarContrasena = async (id, { actual, nueva }) => {
  if (!actual || !nueva) throw { status: 400, message: 'actual y nueva son requeridos' };
  const usuario = await repo.findByCorreo((await getById(id)).correo);
  const ok = await bcrypt.compare(actual, usuario.contrasena);
  if (!ok) throw { status: 401, message: 'Contraseña actual incorrecta' };
  const hash = await bcrypt.hash(nueva, 10);
  await repo.updateContrasena(id, hash);
};

const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

const login = async (correo, contrasena) => {
  if (!correo || !contrasena)
    throw { status: 400, message: 'correo y contrasena son requeridos' };
  const usuario = await repo.findByCorreo(correo);
  if (!usuario) throw { status: 401, message: 'Credenciales inválidas' };
  const ok = await bcrypt.compare(contrasena, usuario.contrasena);
  if (!ok) throw { status: 401, message: 'Credenciales inválidas' };
  const { contrasena: _, ...datos } = usuario;
  return datos;
};

module.exports = { getAll, getById, create, update, cambiarContrasena, remove, login };
