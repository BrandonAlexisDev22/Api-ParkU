/**
 * @module ReservaRepository
 * @description Capa de persistencia para la gestión de reservas de celdas.
 * Toda escritura requiere contexto de usuario (auditoría/historial vía triggers) --
 * ver reserva.service.js y dbContext.util.js. La BD también valida solapamientos
 * (fn_validar_conflicto_reserva); la comprobación aquí es una segunda barrera para
 * devolver un 409 con buen mensaje antes de llegar a la excepción de Postgres.
 */

const { Op } = require('sequelize');
const { Reserva, Celda, Usuario, Conductor, Vehiculo } = require('../models');

const includeContexto = [
  { model: Celda, as: 'celda', attributes: ['id', 'numero', 'parqueadero'] },
  { model: Usuario, as: 'usuarioRegistra', attributes: ['id', 'nombre'] },
  { model: Conductor, as: 'conductor', attributes: ['id', 'nombre_apellidos'] },
  { model: Vehiculo, as: 'vehiculo', attributes: ['id', 'placa'] },
];

/**
 * Recupera todas las reservas ordenadas cronológicamente por inicio.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const rows = await Reserva.findAll({ include: includeContexto, order: [['fecha_hora_inicio', 'DESC']] });
  return rows.map((r) => r.toJSON());
};

/**
 * Busca una reserva específica por su ID.
 * @param {number} id
 * @param {import('sequelize').Transaction} [opciones.transaction] - Pasarla cuando se llama
 *   justo después de un create/update en la misma transacción: si no, esta lectura sale por
 *   otra conexión del pool y no ve la fila todavía sin confirmar (queda en null).
 * @returns {Promise<Object|null>}
 */
const findById = async (id, { transaction } = {}) => {
  const row = await Reserva.findByPk(id, { include: includeContexto, transaction });
  return row ? row.toJSON() : null;
};

/**
 * Obtiene el historial de reservas de un vehículo.
 * @param {number} vehiculoId
 * @returns {Promise<Array>}
 */
const findByVehiculo = async (vehiculoId) => {
  const rows = await Reserva.findAll({
    where: { vehiculo_id: vehiculoId },
    include: includeContexto,
    order: [['fecha_hora_inicio', 'DESC']],
  });
  return rows.map((r) => r.toJSON());
};

/**
 * Obtiene la agenda de reservas de una celda específica.
 * @param {number} celdaId
 * @returns {Promise<Array>}
 */
const findByCelda = async (celdaId) => {
  const rows = await Reserva.findAll({
    where: { celda_id: celdaId },
    include: includeContexto,
    order: [['fecha_hora_inicio', 'DESC']],
  });
  return rows.map((r) => r.toJSON());
};

/**
 * Reservas PENDIENTE/ACEPTADA (no gestionadas o vigentes) de un parqueadero, vía su celda
 * -- reserva no tiene parqueadero_id propio. Usada por la cascada de desactivación de
 * parqueadero (parqueadero.service.js) para cancelarlas todas dentro de la misma
 * transacción.
 * @param {number} parqueaderoId
 * @param {import('sequelize').Transaction} opciones.transaction
 * @param {boolean} [opciones.lock]
 * @returns {Promise<Array>}
 */
const findActivasPorParqueadero = async (parqueaderoId, { transaction, lock } = {}) => {
  const rows = await Reserva.findAll({
    where: { estado: { [Op.in]: ['PENDIENTE', 'ACEPTADA'] } },
    include: [{ model: Celda, as: 'celda', attributes: [], where: { parqueadero: parqueaderoId }, required: true }],
    transaction,
    // Lock solo sobre 'reserva' (of: Reserva): el JOIN con celda es solo para filtrar por
    // parqueadero (attributes: [] -- no trae columnas de celda), así que no hay lado
    // nullable de outer join que bloquear.
    lock: lock && transaction ? { level: transaction.LOCK.UPDATE, of: Reserva } : undefined,
  });
  return rows.map((r) => r.toJSON());
};

/**
 * Reservas que ya no tienen sentido (ver vencerCaducadas en el service): las ACEPTADAS a las
 * que se les pasó el margen de llegada, y las PENDIENTES que llegaron al margen de
 * confirmación sin que nadie las aprobara.
 * @param {Date} limiteConfirmacion - `ahora` más el margen de confirmación.
 * @param {Date} limiteLlegada - `ahora` menos el margen de llegada.
 * @returns {Promise<Array>}
 */
const findCaducadas = async (limiteConfirmacion, limiteLlegada) => {
  const rows = await Reserva.findAll({
    where: {
      [Op.or]: [
        { estado: 'ACEPTADA', fecha_hora_inicio: { [Op.lt]: limiteLlegada } },
        { estado: 'PENDIENTE', fecha_hora_inicio: { [Op.lt]: limiteConfirmacion } },
      ],
    },
    order: [['fecha_hora_inicio', 'ASC']],
  });
  return rows.map((r) => r.toJSON());
};

/**
 * Detecta conflictos de horario para una celda: solo cuentan las reservas ACEPTADAS.
 *
 * Una solicitud PENDIENTE no compromete la franja — dos personas pueden pedir la misma hora
 * y que decida quien gestiona el parqueadero (al aceptar una, las demás se cancelan solas).
 * Antes también chocaban entre ellas, así que la reserva se resolvía por orden de llegada y
 * la segunda persona recibía un rechazo por algo que nadie había aprobado todavía.
 * @param {number} celdaId
 * @param {string|Date} inicio
 * @param {string|Date} fin
 * @param {number|null} [excludeId] - ID de reserva a ignorar (útil en actualizaciones).
 * @returns {Promise<Array>}
 */
const findConflictos = async (celdaId, inicio, fin, excludeId = null) => {
  const where = {
    celda_id: celdaId,
    estado: 'ACEPTADA',
    fecha_hora_inicio: { [Op.lt]: fin },
    fecha_hora_fin: { [Op.gt]: inicio },
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };

  const rows = await Reserva.findAll({ where });
  return rows.map((r) => r.toJSON());
};

/**
 * La reserva que está VIGENTE en una celda en un momento dado: la aceptada cuyo rango
 * contiene ese instante. Es la única que impide que otro vehículo ocupe la celda — las de
 * más tarde no estorban, para eso la celda tiene agenda.
 * @param {number} celdaId
 * @param {Date} [momento]
 * @returns {Promise<Object|null>}
 */
const findVigenteEnCelda = async (celdaId, momento = new Date()) => {
  const row = await Reserva.findOne({
    where: {
      celda_id: celdaId,
      estado: 'ACEPTADA',
      fecha_hora_inicio: { [Op.lte]: momento },
      fecha_hora_fin: { [Op.gt]: momento },
    },
    include: includeContexto,
    order: [['fecha_hora_inicio', 'ASC']],
  });
  return row ? row.toJSON() : null;
};

/**
 * La siguiente reserva aceptada de una celda a partir de un momento: la que marca hasta
 * cuándo puede quedarse quien ocupe la celda ahora.
 * @param {number} celdaId
 * @param {Date} [desde]
 * @returns {Promise<Object|null>}
 */
const findProximaEnCelda = async (celdaId, desde = new Date()) => {
  const row = await Reserva.findOne({
    where: {
      celda_id: celdaId,
      estado: 'ACEPTADA',
      fecha_hora_inicio: { [Op.gt]: desde },
    },
    include: includeContexto,
    order: [['fecha_hora_inicio', 'ASC']],
  });
  return row ? row.toJSON() : null;
};

/**
 * Solicitudes PENDIENTES que compiten por la misma celda y franja que otra reserva. Al
 * aceptar una, estas dejan de tener sentido: la franja ya está tomada.
 * @param {number} celdaId
 * @param {Date|string} inicio
 * @param {Date|string} fin
 * @param {number} excluirId
 * @returns {Promise<Array>}
 */
const findPendientesQueChocan = async (celdaId, inicio, fin, excluirId) => {
  const rows = await Reserva.findAll({
    where: {
      celda_id: celdaId,
      estado: 'PENDIENTE',
      id: { [Op.ne]: excluirId },
      fecha_hora_inicio: { [Op.lt]: fin },
      fecha_hora_fin: { [Op.gt]: inicio },
    },
    order: [['fecha_hora_inicio', 'ASC']],
  });
  return rows.map((r) => r.toJSON());
};

/**
 * Reservas que hacen inservible una celda para OTRO vehículo en este momento: las aceptadas
 * que siguen vivas y empiezan antes de `limite`.
 *
 * Son dos casos en una sola consulta, los mismos que aplica _validarReservaDeCelda: la que
 * está en curso ahora, y la que viene tan pronto que no daría tiempo a ocupar la celda y
 * desalojarla. Se resuelve para todas las celdas de una vez porque el listado de celdas
 * disponibles lo necesita para el parqueadero entero.
 *
 * @param {number[]} celdaIds
 * @param {Date} limite - Hasta cuándo mirar hacia adelante (ahora + margen para estacionar).
 * @param {Date} [momento] - Referencia de "ahora".
 * @returns {Promise<Array>} Reservas con celda_id y vehiculo_id.
 */
const findQueRetienen = async (celdaIds, limite, momento = new Date()) => {
  if (!celdaIds.length) return [];
  const rows = await Reserva.findAll({
    where: {
      celda_id: { [Op.in]: celdaIds },
      estado: 'ACEPTADA',
      fecha_hora_fin: { [Op.gt]: momento },
      fecha_hora_inicio: { [Op.lt]: limite },
    },
    order: [['fecha_hora_inicio', 'ASC']],
  });
  return rows.map((r) => r.toJSON());
};

/**
 * Reserva que tiene apalabrada una celda: la ACEPTADA más próxima que todavía no ha
 * terminado.
 *
 * No se filtra por "que contenga este instante" a propósito: sirve para saber si alguien
 * está esperando esa celda, no si la está usando ahora. Una reserva de dentro de tres horas
 * cuenta — es justo la que no hay que perder de vista al mover o soltar la celda.
 *
 * @param {number} celdaId
 * @param {Date} [momento] - Referencia temporal; por defecto, ahora.
 * @returns {Promise<Object|null>}
 */
const findReservaQueBloquea = async (celdaId, momento = new Date(), { transaction } = {}) => {
  const row = await Reserva.findOne({
    where: {
      celda_id: celdaId,
      estado: 'ACEPTADA',
      fecha_hora_fin: { [Op.gt]: momento },
    },
    order: [['fecha_hora_inicio', 'ASC']],
    transaction,
  });
  return row ? row.toJSON() : null;
};

/**
 * Crea una nueva reserva en el sistema.
 * @param {Object} data
 * @param {import('sequelize').Transaction} opciones.transaction
 * @returns {Promise<Object>} La reserva creada con su contexto.
 */
const create = async (data, { transaction } = {}) => {
  const {
    tipo_reserva, celda_id, usuario_registra_id, conductor_id, vehiculo_id,
    motivo, fecha_hora_inicio, fecha_hora_fin, estado = 'PENDIENTE',
    // Obligatorio para cualquier estado distinto de PENDIENTE: la BD lo exige con
    // chk_reserva_gestion. Antes no estaba en esta lista, así que crear una reserva ya
    // aceptada (la que registra un Admin/Vigilante) reventaba contra el CHECK.
    usuario_gestiona_id = null,
  } = data;

  const nueva = await Reserva.create(
    {
      tipo_reserva, celda_id, usuario_registra_id, conductor_id, vehiculo_id,
      motivo, fecha_hora_inicio, fecha_hora_fin, estado, usuario_gestiona_id,
    },
    { transaction }
  );
  return findById(nueva.id, { transaction });
};

/**
 * Actualiza parcialmente una reserva existente (no toca estado; usar cambiarEstado).
 * @param {number} id
 * @param {Object} data - Campos a actualizar (todos opcionales).
 * @param {import('sequelize').Transaction} opciones.transaction
 * @returns {Promise<Object>}
 */
const update = async (id, data, { transaction } = {}) => {
  const allowedFields = ['tipo_reserva', 'celda_id', 'conductor_id', 'vehiculo_id', 'motivo', 'fecha_hora_inicio', 'fecha_hora_fin'];
  const cambios = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) cambios[field] = data[field];
  }
  if (Object.keys(cambios).length === 0) {
    return findById(id, { transaction });
  }
  await Reserva.update(cambios, { where: { id }, transaction });
  return findById(id, { transaction });
};

/**
 * Cambia el estado de una reserva (aceptar/rechazar/cancelar/terminar). La BD
 * bloquea o libera la celda sola vía fn_reserva_bloquea_celda.
 * @param {number} id
 * @param {string} estado
 * @param {number|null} usuarioGestionaId
 * @param {import('sequelize').Transaction} opciones.transaction
 * @returns {Promise<Object>}
 */
const cambiarEstado = async (id, estado, usuarioGestionaId, motivoRechazo, { transaction } = {}) => {
  const cambios = { estado };
  if (usuarioGestionaId) cambios.usuario_gestiona_id = usuarioGestionaId;
  if (motivoRechazo !== undefined) cambios.motivo_rechazo = motivoRechazo;
  await Reserva.update(cambios, { where: { id }, transaction });
  return findById(id, { transaction });
};

/**
 * Elimina una reserva del sistema.
 * @param {number} id
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<boolean>}
 */
const remove = async (id, { transaction } = {}) => {
  const filasEliminadas = await Reserva.destroy({ where: { id }, transaction });
  return filasEliminadas > 0;
};

module.exports = {
  findAll,
  findById,
  findByVehiculo,
  findByCelda,
  findActivasPorParqueadero,
  findCaducadas,
  findConflictos,
  findVigenteEnCelda,
  findProximaEnCelda,
  findPendientesQueChocan,
  findReservaQueBloquea,
  findQueRetienen,
  create,
  update,
  cambiarEstado,
  remove,
};
