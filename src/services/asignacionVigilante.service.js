/**
 * @module AsignacionVigilanteService
 * @description Turnos y parqueaderos asignados a cada vigilante.
 */

const repo = require('../repositories/asignacionVigilante.repository');
const usuarioRepo = require('../repositories/usuario.repository');
const parqRepo = require('../repositories/parqueadero.repository');

const TURNOS_PERMITIDOS = ['MANANA', 'TARDE', 'NOCHE'];

const getAll = () => repo.findAll();

const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Asignación no encontrada' };
  return item;
};

const getByUsuario = (usuarioId) => repo.findByUsuario(usuarioId);

const _validarHoras = (horaInicio, horaFin) => {
  if (horaInicio && horaFin && horaFin <= horaInicio) {
    throw { status: 400, message: 'hora_fin debe ser posterior a hora_inicio' };
  }
};

const create = async ({ usuario_id, parqueadero_id, turno, fecha_inicio, fecha_fin, hora_inicio, hora_fin }) => {
  if (!usuario_id) throw { status: 400, message: 'usuario_id es requerido' };
  if (!parqueadero_id) throw { status: 400, message: 'parqueadero_id es requerido' };
  if (!turno || !TURNOS_PERMITIDOS.includes(turno)) {
    throw { status: 400, message: `Turno inválido. Permitidos: ${TURNOS_PERMITIDOS.join(', ')}` };
  }
  if (!fecha_inicio) throw { status: 400, message: 'fecha_inicio es requerida' };
  _validarHoras(hora_inicio, hora_fin);

  const usuario = await usuarioRepo.findById(usuario_id);
  if (!usuario) throw { status: 404, message: 'Usuario no encontrado' };
  const parq = await parqRepo.findById(parqueadero_id);
  if (!parq) throw { status: 404, message: 'Parqueadero no encontrado' };

  return repo.create({ usuario_id, parqueadero_id, turno, fecha_inicio, fecha_fin, hora_inicio, hora_fin });
};

const update = async (id, data) => {
  const actual = await getById(id);
  if (data.turno && !TURNOS_PERMITIDOS.includes(data.turno)) {
    throw { status: 400, message: `Turno inválido. Permitidos: ${TURNOS_PERMITIDOS.join(', ')}` };
  }
  const horaInicio = data.hora_inicio !== undefined ? data.hora_inicio : actual.hora_inicio;
  const horaFin = data.hora_fin !== undefined ? data.hora_fin : actual.hora_fin;
  _validarHoras(horaInicio, horaFin);

  if (data.usuario_id) {
    const usuario = await usuarioRepo.findById(data.usuario_id);
    if (!usuario) throw { status: 404, message: 'Usuario no encontrado' };
  }
  if (data.parqueadero_id) {
    const parq = await parqRepo.findById(data.parqueadero_id);
    if (!parq) throw { status: 404, message: 'Parqueadero no encontrado' };
  }

  return repo.update(id, data);
};

const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, getByUsuario, create, update, remove };
