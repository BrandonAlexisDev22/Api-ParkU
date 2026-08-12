/**
 * @module EquipamientoParqueaderoRepository
 * @description CRUD para 'equipamiento_parqueadero'. No lleva trigger de auditoría, no
 * requiere contexto de usuario.
 */

const { EquipamientoParqueadero } = require('../models');

const findByParqueadero = async (parqueaderoId) => {
  const rows = await EquipamientoParqueadero.findAll({
    where: { parqueadero_id: parqueaderoId },
    order: [['tipo', 'ASC'], ['nombre', 'ASC']],
  });
  return rows.map((r) => r.toJSON());
};

const findById = async (id) => {
  const row = await EquipamientoParqueadero.findByPk(id);
  return row ? row.toJSON() : null;
};

const create = async (data) => {
  const nuevo = await EquipamientoParqueadero.create(data);
  return findById(nuevo.id);
};

const update = async (id, data) => {
  const allowedFields = ['tipo', 'nombre', 'codigo', 'ubicacion', 'estado', 'observaciones', 'fecha_instalacion'];
  const cambios = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) cambios[field] = data[field];
  }
  if (Object.keys(cambios).length === 0) return findById(id);
  await EquipamientoParqueadero.update(cambios, { where: { id } });
  return findById(id);
};

const remove = async (id) => {
  const filasEliminadas = await EquipamientoParqueadero.destroy({ where: { id } });
  return filasEliminadas > 0;
};

module.exports = { findByParqueadero, findById, create, update, remove };
