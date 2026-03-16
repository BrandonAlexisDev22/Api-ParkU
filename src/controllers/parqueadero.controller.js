const svc = require('../services/parqueadero.service');
const { handleError } = require('../helpers/errorHandler');

const getAll  = async (req, res) => { try { res.json(await svc.getAll()); } catch(e) { handleError(res,e); } };
const getById = async (req, res) => { try { res.json(await svc.getById(req.params.id)); } catch(e) { handleError(res,e); } };
const create  = async (req, res) => { try { res.status(201).json(await svc.create(req.body)); } catch(e) { handleError(res,e); } };
const update  = async (req, res) => { try { res.json(await svc.update(req.params.id, req.body)); } catch(e) { handleError(res,e); } };
const remove  = async (req, res) => { try { await svc.remove(req.params.id); res.status(204).send(); } catch(e) { handleError(res,e); } };

module.exports = { getAll, getById, create, update, remove };
