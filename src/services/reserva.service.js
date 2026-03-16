const repo      = require('../repositories/reserva.repository');
const celdaRepo = require('../repositories/celda.repository');
const vehRepo   = require('../repositories/vehiculo.repository');

const getAll = () => repo.findAll();

const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Reserva no encontrada' };
  return item;
};

const getByVehiculo = (vehiculoId) => repo.findByVehiculo(vehiculoId);
const getByCelda    = (celdaId)    => repo.findByCelda(celdaId);

const _validarFechas = (inicio, fin) => {
  const i = new Date(inicio);
  const f = new Date(fin);
  if (isNaN(i) || isNaN(f)) throw { status: 400, message: 'Fechas inválidas' };
  if (i >= f) throw { status: 400, message: 'fechaHora_inicio debe ser anterior a fechaHora_fin' };
  if (i < new Date()) throw { status: 400, message: 'No se puede reservar en una fecha pasada' };
};

const create = async ({ celda, vehiculo, fechaHora_inicio, fechaHora_fin }) => {
  if (!celda || !vehiculo || !fechaHora_inicio || !fechaHora_fin)
    throw { status: 400, message: 'celda, vehiculo, fechaHora_inicio y fechaHora_fin son requeridos' };

  _validarFechas(fechaHora_inicio, fechaHora_fin);

  const celdaExiste = await celdaRepo.findById(celda);
  if (!celdaExiste) throw { status: 404, message: 'Celda no encontrada' };

  const vehExiste = await vehRepo.findById(vehiculo);
  if (!vehExiste) throw { status: 404, message: 'Vehículo no encontrado' };

  const conflictos = await repo.findConflictos(celda, fechaHora_inicio, fechaHora_fin);
  if (conflictos.length) throw { status: 409, message: 'La celda ya tiene una reserva en ese horario' };

  return repo.create({ celda, vehiculo, fechaHora_inicio, fechaHora_fin });
};

const update = async (id, datos) => {
  const reserva = await getById(id);
  _validarFechas(datos.fechaHora_inicio, datos.fechaHora_fin);

  const conflictos = await repo.findConflictos(
    datos.celda || reserva.celda_id,
    datos.fechaHora_inicio,
    datos.fechaHora_fin,
    id
  );
  if (conflictos.length) throw { status: 409, message: 'La celda ya tiene una reserva en ese horario' };

  return repo.update(id, datos);
};

const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, getByVehiculo, getByCelda, create, update, remove };
