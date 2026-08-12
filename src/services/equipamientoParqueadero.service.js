/**
 * @module EquipamientoParqueaderoService
 * @description CRUD del equipamiento (sensores, cámaras, cargadores, barreras...) de
 * cada parqueadero.
 */

const repo = require('../repositories/equipamientoParqueadero.repository');
const parqRepo = require('../repositories/parqueadero.repository');

const TIPOS_PERMITIDOS = ['SENSOR', 'CAMARA', 'CARGADOR_ELECTRICO', 'BARRERA', 'OTRO'];

const getByParqueadero = async (parqueaderoId) => {
  const parq = await parqRepo.findById(parqueaderoId);
  if (!parq) throw { status: 404, message: 'Parqueadero no encontrado' };
  return repo.findByParqueadero(parqueaderoId);
};

const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Equipamiento no encontrado' };
  return item;
};

const create = async (parqueaderoId, { tipo, nombre, codigo, ubicacion, observaciones, fecha_instalacion }) => {
  const parq = await parqRepo.findById(parqueaderoId);
  if (!parq) throw { status: 404, message: 'Parqueadero no encontrado' };
  if (!tipo || !TIPOS_PERMITIDOS.includes(tipo)) {
    throw { status: 400, message: `Tipo inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }
  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };

  return repo.create({ parqueadero_id: parqueaderoId, tipo, nombre, codigo, ubicacion, observaciones, fecha_instalacion });
};

const update = async (id, data) => {
  await getById(id);
  if (data.tipo && !TIPOS_PERMITIDOS.includes(data.tipo)) {
    throw { status: 400, message: `Tipo inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }
  return repo.update(id, data);
};

const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getByParqueadero, getById, create, update, remove };
