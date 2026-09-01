/**
 * @module NovedadService
 * @description Lógica de negocio para la gestión de novedades (Proceso 07.1).
 * Alineado con el modelo Novedad real: tipo_novedad, prioridad, estado, descripcion,
 * usuario_reporta_id (quien la reporta, se toma del usuario autenticado -- HU 07.1.8.3/
 * 07.1.9.1 exigen poder filtrar "solo las mías"), usuario_asignado_id, vehiculo_id,
 * celda_id (la ubicación), parqueadero_id, registro_acceso_id.
 */

const repo = require('../repositories/novedades.repository');
const vehRepo = require('../repositories/vehiculo.repository');
const celdaRepo = require('../repositories/celda.repository');
const parqRepo = require('../repositories/parqueadero.repository');
const registroAccesoRepo = require('../repositories/entradaSalida.repository');
const usuarioRepo = require('../repositories/usuario.repository');
const { runWithUsuario, traducirErrorTrigger } = require('../utils/dbContext.util');

const TIPOS_PERMITIDOS = ['DANIO', 'ACCIDENTE', 'MAL_ESTACIONAMIENTO', 'QUEJA', 'OTRO'];
const PRIORIDADES_PERMITIDAS = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
const ESTADOS_PERMITIDOS = ['PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'CERRADA', 'CANCELADA'];

/**
 * Obtiene todas las novedades.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca una novedad por ID.
 * @param {number} id
 * @throws {Object} 404 si no existe.
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Novedad no encontrada' };
  return item;
};

/**
 * Obtiene novedades por vehículo.
 * @param {number} vehiculoId
 * @returns {Promise<Array>}
 */
const getByVehiculo = (vehiculoId) => repo.findByVehiculo(vehiculoId);

/**
 * Obtiene novedades asociadas a un registro de acceso (ingreso/salida).
 * @param {number} registroAccesoId
 * @returns {Promise<Array>}
 */
const getByRegistroAcceso = (registroAccesoId) => repo.findByRegistroAcceso(registroAccesoId);

/**
 * Filtra novedades por tipo, prioridad y/o estado.
 * @param {Object} filtros
 * @returns {Promise<Array>}
 */
const getByFiltros = (filtros) => repo.findByFiltros(filtros);

/**
 * Valida que las entidades relacionadas (si vienen) existan.
 * @private
 */
const _validarReferencias = async ({ vehiculo_id, celda_id, parqueadero_id, registro_acceso_id, usuario_asignado_id }) => {
  if (vehiculo_id) {
    const veh = await vehRepo.findById(vehiculo_id);
    if (!veh) throw { status: 404, message: 'Vehículo no encontrado' };
  }
  if (celda_id) {
    const celda = await celdaRepo.findById(celda_id);
    if (!celda) throw { status: 404, message: 'Celda no encontrada' };
  }
  if (parqueadero_id) {
    const parq = await parqRepo.findById(parqueadero_id);
    if (!parq) throw { status: 404, message: 'Parqueadero no encontrado' };
  }
  if (registro_acceso_id) {
    const mov = await registroAccesoRepo.findById(registro_acceso_id);
    if (!mov) throw { status: 404, message: 'Registro de acceso no encontrado' };
  }
  if (usuario_asignado_id) {
    const user = await usuarioRepo.findById(usuario_asignado_id);
    if (!user) throw { status: 404, message: 'Usuario asignado no encontrado' };
  }
};

/**
 * Crea una nueva novedad. El reportante es siempre el usuario autenticado.
 * @param {Object} data
 * @param {number} usuarioId - Usuario autenticado que reporta la novedad.
 * @throws {Object} 400 si faltan datos o son inválidos; 404 si alguna referencia no existe.
 * @returns {Promise<Object>}
 */
const create = async (data, usuarioId) => {
  const {
    tipo_novedad = 'OTRO', prioridad = 'MEDIA', descripcion,
    usuario_asignado_id, vehiculo_id, celda_id, parqueadero_id, registro_acceso_id,
  } = data;

  if (!descripcion) throw { status: 400, message: 'La descripción es requerida' };
  if (!TIPOS_PERMITIDOS.includes(tipo_novedad)) {
    throw { status: 400, message: `Tipo de novedad inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }
  if (!PRIORIDADES_PERMITIDAS.includes(prioridad)) {
    throw { status: 400, message: `Prioridad inválida. Permitidas: ${PRIORIDADES_PERMITIDAS.join(', ')}` };
  }

  await _validarReferencias({ vehiculo_id, celda_id, parqueadero_id, registro_acceso_id, usuario_asignado_id });

  return runWithUsuario(usuarioId, (transaction) => repo.create(
    { tipo_novedad, prioridad, descripcion, usuario_reporta_id: usuarioId, usuario_asignado_id, vehiculo_id, celda_id, parqueadero_id, registro_acceso_id },
    { transaction },
  ));
};

/**
 * Actualiza una novedad (estado, prioridad, asignación, cierre, etc.).
 * @param {number} id
 * @param {Object} data - Campos a actualizar.
 * @param {number} usuarioId - Usuario autenticado que hace la operación.
 * @throws {Object} 404 si no existe o alguna referencia no existe; 400 si algún valor no es válido.
 * @returns {Promise<Object>}
 */
const update = async (id, data, usuarioId) => {
  await getById(id);

  if (data.tipo_novedad && !TIPOS_PERMITIDOS.includes(data.tipo_novedad)) {
    throw { status: 400, message: `Tipo de novedad inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }
  if (data.prioridad && !PRIORIDADES_PERMITIDAS.includes(data.prioridad)) {
    throw { status: 400, message: `Prioridad inválida. Permitidas: ${PRIORIDADES_PERMITIDAS.join(', ')}` };
  }
  if (data.estado && !ESTADOS_PERMITIDOS.includes(data.estado)) {
    throw { status: 400, message: `Estado inválido. Permitidos: ${ESTADOS_PERMITIDOS.join(', ')}` };
  }

  await _validarReferencias(data);

  return runWithUsuario(usuarioId, (transaction) => repo.update(id, data, { transaction }));
};

/**
 * Elimina una novedad.
 * @param {number} id
 * @throws {Object} 404 si no existe; 409 si tiene evidencias adjuntas.
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  await getById(id);
  try {
    return await repo.remove(id);
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

module.exports = {
  getAll,
  getById,
  getByVehiculo,
  getByRegistroAcceso,
  getByFiltros,
  create,
  update,
  remove,
};
