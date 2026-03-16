const svc = require('../services/rolPermiso.service');
const { handleError } = require('../helpers/errorHandler');

const getAll   = async (req, res) => { try { res.json(await svc.getAll()); } catch(e) { handleError(res,e); } };
const getByRol = async (req, res) => { try { res.json(await svc.getByRol(req.params.rolId)); } catch(e) { handleError(res,e); } };
const create   = async (req, res) => { try { res.status(201).json(await svc.create(req.body.rol, req.body.permiso)); } catch(e) { handleError(res,e); } };
const remove   = async (req, res) => { try { await svc.remove(req.params.id); res.status(204).send(); } catch(e) { handleError(res,e); } };

module.exports = { getAll, getByRol, create, remove };
