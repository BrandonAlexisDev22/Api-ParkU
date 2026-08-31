/**
 * @module ParqueaderoService
 * @description Lógica de negocio para la administración de sedes/instalaciones de
 * parqueo (Proceso 03.1). Alineado con el modelo Parqueadero real.
 *
 * parqueadero lleva trigger de auditoría/historial (requiere SET LOCAL app.usuario_id),
 * y cambiar su columna 'estado' exige además SET LOCAL app.motivo (única tabla con esa
 * regla) -- por eso el cambio de estado va por cambiarEstado(), separado de update().
 */

const repo = require('../repositories/parqueadero.repository');
const { runWithUsuario, traducirErrorTrigger } = require('../utils/dbContext.util');

const ACCESOS_PERMITIDOS = ['REGIONAL', 'AVENIDA_BOYACA'];
const TIPOS_PERMITIDOS = ['GENERAL', 'DOCENTES', 'ADMINISTRATIVOS', 'APRENDICES', 'VISITANTES', 'MOTOS', 'VEHICULO_SENA'];

/**
 * Obtiene todas las sedes registradas.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca una sede por su ID.
 * @param {number} id
 * @throws {Object} 404 si no existe.
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Parqueadero no encontrado' };
  return item;
};

/**
 * Crea una nueva sede validando que el nombre sea único.
 * @param {Object} data - Datos del parqueadero.
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 400 si faltan datos o son inválidos.
 * @throws {Object} 409 si el nombre ya está en uso.
 * @returns {Promise<Object>} Parqueadero creado.
 */
const create = async (data, usuarioId) => {
  const { nombre, ubicacion, acceso = 'REGIONAL', tipo = 'GENERAL' } = data;

  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };
  if (!ubicacion) throw { status: 400, message: 'La ubicación es requerida' };
  if (!ACCESOS_PERMITIDOS.includes(acceso)) {
    throw { status: 400, message: `Acceso inválido. Permitidos: ${ACCESOS_PERMITIDOS.join(', ')}` };
  }
  if (!TIPOS_PERMITIDOS.includes(tipo)) {
    throw { status: 400, message: `Tipo inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }

  const existe = await repo.findByNombre(nombre);
  if (existe) throw { status: 409, message: 'Ya existe un parqueadero con ese nombre' };

  try {
    return await runWithUsuario(usuarioId, (transaction) => repo.create({ ...data, acceso, tipo }, { transaction }));
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

/**
 * Actualiza los datos de una sede (no toca 'estado'; usar cambiarEstado).
 * @param {number} id
 * @param {Object} data - Campos a actualizar (todos opcionales).
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 404 si el parqueadero no existe.
 * @throws {Object} 400 si acceso/tipo no son válidos.
 * @throws {Object} 409 si el nuevo nombre ya pertenece a otra sede.
 * @returns {Promise<Object>} Parqueadero actualizado.
 */
const update = async (id, data, usuarioId) => {
  await getById(id);

  if (data.acceso && !ACCESOS_PERMITIDOS.includes(data.acceso)) {
    throw { status: 400, message: `Acceso inválido. Permitidos: ${ACCESOS_PERMITIDOS.join(', ')}` };
  }
  if (data.tipo && !TIPOS_PERMITIDOS.includes(data.tipo)) {
    throw { status: 400, message: `Tipo inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }
  if (data.nombre) {
    const dup = await repo.findByNombre(data.nombre);
    if (dup && dup.id !== Number(id)) {
      throw { status: 409, message: 'Ya existe un parqueadero con ese nombre' };
    }
  }

  try {
    return await runWithUsuario(usuarioId, (transaction) => repo.update(id, data, { transaction }));
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

/**
 * Activa o inactiva un parqueadero. La BD exige un motivo en la misma transacción
 * (HU 03.1.6.2).
 * @param {number} id
 * @param {boolean} estado
 * @param {string} motivo - Obligatorio.
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 404 si no existe, 400 si falta el motivo.
 * @returns {Promise<Object>}
 */
const cambiarEstado = async (id, estado, motivo, usuarioId) => {
  await getById(id);
  if (typeof estado !== 'boolean') throw { status: 400, message: 'estado debe ser true o false' };
  if (!motivo) throw { status: 400, message: 'El motivo es obligatorio para cambiar el estado de un parqueadero' };

  try {
    return await runWithUsuario(usuarioId, (transaction) => repo.cambiarEstado(id, estado, { transaction }), { motivo });
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

/**
 * Elimina una sede del sistema.
 * @param {number} id
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 404 si no existe.
 * @throws {Object} 409 si tiene celdas asociadas (integridad referencial).
 * @returns {Promise<boolean>}
 */
const remove = async (id, usuarioId) => {
  await getById(id);
  try {
    return await runWithUsuario(usuarioId, (transaction) => repo.remove(id, { transaction }));
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

module.exports = { getAll, getById, create, update, cambiarEstado, remove };
