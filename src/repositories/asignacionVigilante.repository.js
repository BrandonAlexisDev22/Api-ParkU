/**
 * @module AsignacionVigilanteRepository
 * @description CRUD para 'asignacion_vigilante'. No lleva trigger de auditoría, no
 * requiere contexto de usuario.
 */

const { AsignacionVigilante, Usuario, Parqueadero } = require('../models');

const includeContexto = [
  { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo'] },
  { model: Parqueadero, as: 'parqueadero', attributes: ['id', 'nombre'] },
];

const findAll = async () => {
  const rows = await AsignacionVigilante.findAll({ include: includeContexto, order: [['fecha_inicio', 'DESC']] });
  return rows.map((r) => r.toJSON());
};

const findById = async (id) => {
  const row = await AsignacionVigilante.findByPk(id, { include: includeContexto });
  return row ? row.toJSON() : null;
};

const findByUsuario = async (usuarioId) => {
  const rows = await AsignacionVigilante.findAll({
    where: { usuario_id: usuarioId },
    include: includeContexto,
    order: [['fecha_inicio', 'DESC']],
  });
  return rows.map((r) => r.toJSON());
};

const create = async (data) => {
  const nueva = await AsignacionVigilante.create(data);
  return findById(nueva.id);
};

const update = async (id, data) => {
  const allowedFields = ['usuario_id', 'parqueadero_id', 'turno', 'fecha_inicio', 'fecha_fin', 'estado', 'hora_inicio', 'hora_fin'];
  const cambios = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) cambios[field] = data[field];
  }
  if (Object.keys(cambios).length === 0) return findById(id);
  await AsignacionVigilante.update(cambios, { where: { id } });
  return findById(id);
};

const remove = async (id) => {
  const filasEliminadas = await AsignacionVigilante.destroy({ where: { id } });
  return filasEliminadas > 0;
};

module.exports = { findAll, findById, findByUsuario, create, update, remove };
