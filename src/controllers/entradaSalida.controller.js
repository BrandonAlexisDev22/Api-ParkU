const svc = require('../services/entradaSalida.service');
const { handleError } = require('../helpers/errorHandler');

const getAll          = async (req, res) => { try { res.json(await svc.getAll()); } catch(e) { handleError(res,e); } };
const getById         = async (req, res) => { try { res.json(await svc.getById(req.params.id)); } catch(e) { handleError(res,e); } };
const getByVehiculo   = async (req, res) => { try { res.json(await svc.getByVehiculo(req.params.vehiculoId)); } catch(e) { handleError(res,e); } };
const getByFecha      = async (req, res) => { try { res.json(await svc.getByFecha(req.query.desde, req.query.hasta)); } catch(e) { handleError(res,e); } };
const registrarEntrada = async (req, res) => { try { res.status(201).json(await svc.registrarEntrada(req.body)); } catch(e) { handleError(res,e); } };
const registrarSalida  = async (req, res) => { try { res.status(201).json(await svc.registrarSalida(req.body)); } catch(e) { handleError(res,e); } };
const remove          = async (req, res) => { try { await svc.remove(req.params.id); res.status(204).send(); } catch(e) { handleError(res,e); } };

module.exports = { getAll, getById, getByVehiculo, getByFecha, registrarEntrada, registrarSalida, remove };
