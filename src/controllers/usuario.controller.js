const svc = require('../services/usuario.service');
const { handleError } = require('../helpers/errorHandler');

const getAll          = async (req, res) => { try { res.json(await svc.getAll()); } catch(e) { handleError(res,e); } };
const getById         = async (req, res) => { try { res.json(await svc.getById(req.params.id)); } catch(e) { handleError(res,e); } };
const create          = async (req, res) => { try { res.status(201).json(await svc.create(req.body)); } catch(e) { handleError(res,e); } };
const update          = async (req, res) => { try { res.json(await svc.update(req.params.id, req.body)); } catch(e) { handleError(res,e); } };
const remove          = async (req, res) => { try { await svc.remove(req.params.id); res.status(204).send(); } catch(e) { handleError(res,e); } };
const cambiarContrasena = async (req, res) => {
  try { await svc.cambiarContrasena(req.params.id, req.body); res.json({ message: 'Contraseña actualizada' }); }
  catch(e) { handleError(res,e); }
};
const login = async (req, res) => {
  try { const usuario = await svc.login(req.body.correo, req.body.contrasena); res.json({ message: 'Login exitoso', usuario }); }
  catch(e) { handleError(res,e); }
};

module.exports = { getAll, getById, create, update, remove, cambiarContrasena, login };
