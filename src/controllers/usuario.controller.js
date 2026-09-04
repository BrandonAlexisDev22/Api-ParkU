const svc = require('../services/usuario.service');
const { handleError } = require('../helpers/errorHandler');

const getAll = async (req, res) => {
  try {
    // ?rol=2 o ?rol=Vigilante o ?rol_id=2 filtran por cualquier rol existente en la BD.
    // Sin parámetro devuelve todos, como antes.
    const data = await svc.getAll({ rol: req.query.rol, rol_id: req.query.rol_id });
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

const getById = async (req, res) => {
  try {
    const data = await svc.getById(req.params.id);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

const create = async (req, res) => {
  try {
    const newUser = await svc.create(req.body);
    res.status(201).json(newUser);
  } catch (e) {
    handleError(res, e);
  }
};

const update = async (req, res) => {
  try {
    const updated = await svc.update(req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    handleError(res, e);
  }
};

const actualizarFoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'El archivo de la foto es requerido (campo "foto")' });
    }
    const rutaPublica = `/uploads/perfiles/${req.file.filename}`;
    const usuario = await svc.actualizarFoto(req.usuario.id, rutaPublica);
    res.json(usuario);
  } catch (e) {
    handleError(res, e);
  }
};

const cambiarContrasena = async (req, res) => {
  try {
    await svc.cambiarContrasena(req.params.id, req.body);
    res.json({ message: 'Contraseña actualizada' });
  } catch (e) {
    handleError(res, e);
  }
};

const remove = async (req, res) => {
  try {
    await svc.remove(req.params.id);
    res.status(204).send();
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  actualizarFoto,
  cambiarContrasena,
  remove,
};