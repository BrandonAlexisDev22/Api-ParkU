/**
 * @module NovedadesRepository
 * @description Capa de acceso a datos para la tabla 'novedad'.
 * usuario_reporta_id reemplaza al viejo campo de texto libre 'encargado'.
 */

const { Sequelize } = require('sequelize');
const { Novedad, Vehiculo, Usuario, Celda, Parqueadero, RegistroAcceso, Conductor } = require('../models');

const includeContexto = [
  { model: Vehiculo, as: 'vehiculo', attributes: ['id', 'placa'] },
  { model: Usuario, as: 'reportadoPor', attributes: ['id', 'nombre'] },
  { model: Usuario, as: 'asignadoA', attributes: ['id', 'nombre'] },
  { model: Celda, as: 'celda', attributes: ['id', 'numero'] },
  { model: Parqueadero, as: 'parqueadero', attributes: ['id', 'nombre'] },
  {
    model: RegistroAcceso,
    as: 'registroAcceso',
    attributes: ['id', 'fecha_hora_ingreso', 'fecha_hora_salida', 'es_oficial_sena'],
    include: [
      { model: Vehiculo, as: 'vehiculo', attributes: ['id', 'placa', 'tipo'] },
      {
        model: Conductor,
        as: 'conductor',
        attributes: ['id', 'tipo_documento', 'numero_documento', 'nombre_apellidos', 'correo', 'numero_telefonico'],
      },
    ],
  },
];

// CRITICA primero, BAJA al final -- el orden alfabético/de declaración del enum de
// Postgres no coincide con este orden de negocio, por eso se ordena con un CASE
// explícito en vez de solo `order: [['prioridad', ...]]`.
const ORDEN_PRIORIDAD = "CASE prioridad WHEN 'CRITICA' THEN 1 WHEN 'ALTA' THEN 2 WHEN 'MEDIA' THEN 3 WHEN 'BAJA' THEN 4 END";
const ORDEN_POR_PRIORIDAD_Y_FECHA = [[Sequelize.literal(ORDEN_PRIORIDAD), 'ASC'], ['fecha_hora', 'DESC']];

/**
 * Obtiene todas las novedades, con las de mayor prioridad primero (CRITICA > ALTA >
 * MEDIA > BAJA) y, dentro de una misma prioridad, las más recientes primero.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const rows = await Novedad.findAll({ include: includeContexto, order: ORDEN_POR_PRIORIDAD_Y_FECHA });
  return rows.map((r) => r.toJSON());
};

/**
 * Busca una novedad por su ID.
 * @param {number} id
 * @param {import('sequelize').Transaction} [opciones.transaction] - Si se llama desde dentro
 *   de una transacción abierta (p. ej. justo después de create/update en la misma), hay que
 *   pasarla: si no, esta lectura sale por otra conexión del pool y no ve la fila todavía sin
 *   confirmar (queda en null aunque la escritura sí haya funcionado).
 * @returns {Promise<Object|null>}
 */
const findById = async (id, { transaction } = {}) => {
  const row = await Novedad.findByPk(id, { include: includeContexto, transaction });
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

  const rows = await Novedad.findAll({ where, include: includeContexto, order: ORDEN_POR_PRIORIDAD_Y_FECHA });
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
  return findById(nueva.id, { transaction });
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
    return findById(id, { transaction });
  }
  await Novedad.update(cambios, { where: { id }, transaction });
  return findById(id, { transaction });
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
