/**
 * @module NovedadesRepository
 * @description Capa de acceso a datos para la tabla 'novedad'.
 * usuario_reporta_id reemplaza al viejo campo de texto libre 'encargado'.
 */

const { Novedad, Vehiculo, Usuario, Celda, Parqueadero, RegistroAcceso } = require('../models');

const includeContexto = [
  { model: Vehiculo, as: 'vehiculo', attributes: ['id', 'placa'] },
  { model: Usuario, as: 'reportadoPor', attributes: ['id', 'nombre'] },
  { model: Usuario, as: 'asignadoA', attributes: ['id', 'nombre'] },
  { model: Celda, as: 'celda', attributes: ['id', 'numero'] },
  { model: Parqueadero, as: 'parqueadero', attributes: ['id', 'nombre'] },
  { model: RegistroAcceso, as: 'registroAcceso', attributes: ['id'] },
];

/**
 * Obtiene todas las novedades, ordenadas por fecha descendente.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const rows = await Novedad.findAll({ include: includeContexto, order: [['fecha_hora', 'DESC']] });
  return rows.map((r) => r.toJSON());
};

/**
 * Busca una novedad por su ID.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const row = await Novedad.findByPk(id, { include: includeContexto });
  return row ? row.toJSON() : null;
};

/**
 * Filtra novedades por vehículo.
 * @param {number} vehiculoId
 * @returns {Promise<Array>}
 */
const findByVehiculo = async (vehiculoId) => {
  const rows = await Novedad.findAll({
    where: { vehiculo_id: vehiculoId },
    include: includeContexto,
    order: [['fecha_hora', 'DESC']],
  });
  return rows.map((r) => r.toJSON());
};

/**
 * Filtra novedades por registro de acceso (ingreso/salida) relacionado.
 * @param {number} registroAccesoId
 * @returns {Promise<Array>}
 */
const findByRegistroAcceso = async (registroAccesoId) => {
  const rows = await Novedad.findAll({
    where: { registro_acceso_id: registroAccesoId },
    include: includeContexto,
    order: [['fecha_hora', 'DESC']],
  });
  return rows.map((r) => r.toJSON());
};

/**
 * Filtra novedades por tipo, prioridad y/o estado.
 * @param {Object} filtros - { tipo_novedad, prioridad, estado }
 * @returns {Promise<Array>}
 */
const findByFiltros = async ({ tipo_novedad, prioridad, estado }) => {
  const where = {};
  if (tipo_novedad) where.tipo_novedad = tipo_novedad;
  if (prioridad) where.prioridad = prioridad;
  if (estado) where.estado = estado;

  const rows = await Novedad.findAll({ where, include: includeContexto, order: [['fecha_hora', 'DESC']] });
  return rows.map((r) => r.toJSON());
};

/**
 * Crea una nueva novedad.
 * @param {Object} data
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<Object>}
 */
const create = async (data, { transaction } = {}) => {
  const {
    tipo_novedad = 'OTRO', prioridad = 'MEDIA', estado = 'PENDIENTE', descripcion,
    usuario_reporta_id, usuario_asignado_id, vehiculo_id, celda_id, parqueadero_id, registro_acceso_id,
  } = data;

  const nueva = await Novedad.create(
    {
      tipo_novedad, prioridad, estado, descripcion, usuario_reporta_id,
      usuario_asignado_id: usuario_asignado_id || null,
      vehiculo_id: vehiculo_id || null,
      celda_id: celda_id || null,
      parqueadero_id: parqueadero_id || null,
      registro_acceso_id: registro_acceso_id || null,
    },
    { transaction }
  );
  return findById(nueva.id);
};

/**
 * Actualiza parcialmente una novedad.
 * @param {number} id
 * @param {Object} data - Campos a actualizar (todos opcionales)
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<Object>}
 */
const update = async (id, data, { transaction } = {}) => {
  const allowedFields = [
    'tipo_novedad', 'prioridad', 'estado', 'descripcion', 'usuario_asignado_id',
    'vehiculo_id', 'celda_id', 'parqueadero_id', 'registro_acceso_id',
    'fecha_hora_cierre', 'justificacion_cierre',
  ];
  const cambios = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) cambios[field] = data[field];
  }
  if (Object.keys(cambios).length === 0) {
    return findById(id);
  }
  await Novedad.update(cambios, { where: { id }, transaction });
  return findById(id);
};

/**
 * Elimina una novedad.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const filasEliminadas = await Novedad.destroy({ where: { id } });
  return filasEliminadas > 0;
};

module.exports = {
  findAll,
  findById,
  findByVehiculo,
  findByRegistroAcceso,
  findByFiltros,
  create,
  update,
  remove,
};
