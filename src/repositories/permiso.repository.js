/**
 * @module PermisoRepository
 * @description Operaciones de base de datos para la tabla 'permiso' usando Sequelize.
 * El nombre es único solo dentro de su módulo (índice modulo_id+nombre en la BD).
 */

const { Permiso, Modulo } = require('../models');

const includeModulo = {
  model: Modulo,
  as: 'modulo',
  attributes: ['id', 'nombre'],
};

/**
 * Todos los permisos, agrupables por módulo.
 *
 * Se ordena por modulo_id y luego por nombre: así la lista llega ya organizada por módulo
 * (Configuración, Usuarios, Parqueaderos, Control de Ingreso...) y la pantalla de crear/
 * editar rol puede pintar secciones recorriéndola de arriba abajo, sin reordenar nada. El
 * orden alfabético puro que había antes intercalaba módulos -- "reportes.consultar"
 * (Medición y Desempeño) caía entre los de Parqueaderos y los de Reservas.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const rows = await Permiso.findAll({
    include: [includeModulo],
    order: [['modulo_id', 'ASC'], ['nombre', 'ASC']],
  });
  return rows.map((r) => r.toJSON());
};

const findById = async (id) => {
  const row = await Permiso.findByPk(id, { include: [includeModulo] });
  return row ? row.toJSON() : null;
};

/**
 * Busca un permiso por su nombre dentro de un módulo (para validar duplicados).
 * @param {number} moduloId
 * @param {string} nombre
 * @returns {Promise<Object|null>}
 */
const findByModuloAndNombre = async (moduloId, nombre) => {
  const row = await Permiso.findOne({ where: { modulo_id: moduloId, nombre } });
  return row ? row.toJSON() : null;
};

const create = async ({ modulo_id, nombre, descripcion, estado = true }) => {
  const nuevo = await Permiso.create({ modulo_id, nombre, descripcion, estado });
  return findById(nuevo.id);
};

const update = async (id, data) => {
  const allowedFields = ['modulo_id', 'nombre', 'descripcion', 'estado'];
  const cambios = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) cambios[field] = data[field];
  }
  if (Object.keys(cambios).length === 0) return findById(id);

  await Permiso.update(cambios, { where: { id } });
  return findById(id);
};

const remove = async (id) => {
  const filasEliminadas = await Permiso.destroy({ where: { id } });
  return filasEliminadas > 0;
};

module.exports = { findAll, findById, findByModuloAndNombre, create, update, remove };
