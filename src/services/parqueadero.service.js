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
const celdaRepo = require('../repositories/celda.repository');
const { runWithUsuario, traducirErrorTrigger } = require('../utils/dbContext.util');

const ACCESOS_PERMITIDOS = ['REGIONAL', 'AVENIDA_BOYACA'];
const TIPOS_PERMITIDOS = ['GENERAL', 'DOCENTES', 'ADMINISTRATIVOS', 'APRENDICES', 'VISITANTES', 'MOTOS', 'VEHICULO_SENA'];

/**
 * Agrega un campo derivado 'estado_texto' (ACTIVO/INACTIVO) sin reemplazar 'estado'
 * (boolean), que es el que ya consume el frontend -- aditivo, no rompe el contrato.
 * @private
 */
const _conEstadoTexto = (item) => (item ? { ...item, estado_texto: item.estado ? 'ACTIVO' : 'INACTIVO' } : item);
const _conEstadoTextoLista = (items) => items.map(_conEstadoTexto);

/**
 * Acepta boolean (true/false) o las strings 'ACTIVO'/'INACTIVO' (sin distinguir
 * mayúsculas) y devuelve siempre un boolean. No acepta ningún otro valor.
 * @private
 * @throws {Object} 400 si el valor no es reconocible.
 */
const _normalizarEstado = (valor) => {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    const normalizado = valor.trim().toUpperCase();
    if (normalizado === 'ACTIVO') return true;
    if (normalizado === 'INACTIVO') return false;
  }
  throw { status: 400, message: 'Estado inválido. Permitidos: ACTIVO, INACTIVO' };
};

/**
 * Obtiene todas las sedes registradas.
 * @returns {Promise<Array>}
 */
const getAll = async () => _conEstadoTextoLista(await repo.findAll());

/**
 * Busca una sede por su ID.
 * @param {number} id
 * @throws {Object} 404 si no existe.
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Parqueadero no encontrado' };
  return _conEstadoTexto(item);
};

/**
 * Crea una nueva sede validando que el nombre sea único.
 * El estado inicial SIEMPRE es ACTIVO -- se ignora cualquier `estado` que venga en
 * `data` en vez de confiar en lo que mande el cliente.
 * @param {Object} data - Datos del parqueadero.
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 400 si faltan datos o son inválidos (incluida capacidad_maxima).
 * @throws {Object} 409 si el nombre ya está en uso.
 * @returns {Promise<Object>} Parqueadero creado.
 */
const create = async (data, usuarioId) => {
  const { nombre, ubicacion, acceso = 'REGIONAL', tipo = 'GENERAL', capacidad_maxima } = data;

  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };
  if (!ubicacion) throw { status: 400, message: 'La ubicación es requerida' };
  if (!ACCESOS_PERMITIDOS.includes(acceso)) {
    throw { status: 400, message: `Acceso inválido. Permitidos: ${ACCESOS_PERMITIDOS.join(', ')}` };
  }
  if (!TIPOS_PERMITIDOS.includes(tipo)) {
    throw { status: 400, message: `Tipo inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }
  if (!Number.isInteger(capacidad_maxima) || capacidad_maxima <= 0) {
    throw { status: 400, message: 'capacidad_maxima es requerida y debe ser un entero mayor que 0' };
  }

  const existe = await repo.findByNombre(nombre);
  if (existe) throw { status: 409, message: 'Ya existe un parqueadero con ese nombre' };

  const datosLimpios = { ...data };
  delete datosLimpios.estado; // el estado inicial lo decide el backend, nunca el cliente

  try {
    const creado = await runWithUsuario(
      usuarioId,
      (transaction) => repo.create({ ...datosLimpios, acceso, tipo, capacidad_maxima, estado: true }, { transaction }),
    );
    return _conEstadoTexto(creado);
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
  if (data.capacidad_maxima !== undefined) {
    if (!Number.isInteger(data.capacidad_maxima) || data.capacidad_maxima <= 0) {
      throw { status: 400, message: 'capacidad_maxima debe ser un entero mayor que 0' };
    }
    const celdasExistentes = await celdaRepo.contarTotalPorParqueadero(id);
    if (data.capacidad_maxima < celdasExistentes) {
      throw {
        status: 409,
        message: `No se puede fijar capacidad_maxima en ${data.capacidad_maxima}: el parqueadero ya tiene ${celdasExistentes} celdas. Reduce primero la cantidad de celdas (ajustar-cantidades) antes de bajar la capacidad.`,
      };
    }
  }

  try {
    const actualizado = await runWithUsuario(usuarioId, (transaction) => repo.update(id, data, { transaction }));
    return _conEstadoTexto(actualizado);
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

/**
 * Activa o inactiva un parqueadero. La BD exige un motivo en la misma transacción
 * (HU 03.1.6.2). Acepta 'estado' como boolean o como string 'ACTIVO'/'INACTIVO'.
 *
 * DESACTIVAR es una operación PURAMENTE ADMINISTRATIVA: cambia el estado y nada más.
 * NO cierra parqueos, NO cancela reservas y NO libera celdas ocupadas -- los vehículos
 * que ya estaban dentro siguen registrados como estacionados hasta que alguien registre
 * su salida manualmente, para que la base de datos siga reflejando la realidad física
 * del parqueadero. Lo que sí queda bloqueado mientras esté INACTIVO son las operaciones
 * que ocuparían celdas nuevas: registrar ingreso (entradaSalida.service.js) y crear
 * reserva (reserva.service.js). Registrar SALIDA sigue permitido a propósito.
 *
 * La fila del parqueadero se lee con lock (FOR UPDATE) para serializar dos
 * activaciones/desactivaciones concurrentes del mismo parqueadero.
 * @param {number} id
 * @param {boolean|string} estado - true/false, o 'ACTIVO'/'INACTIVO'.
 * @param {string} motivo - Obligatorio.
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 404 si no existe, 400 si falta el motivo o el estado no es válido,
 *   409 si ya se encuentra en ese estado.
 * @returns {Promise<Object>}
 */
const cambiarEstado = async (id, estado, motivo, usuarioId) => {
  const nuevoEstado = _normalizarEstado(estado);
  if (!motivo) throw { status: 400, message: 'El motivo es obligatorio para cambiar el estado de un parqueadero' };

  try {
    const resultado = await runWithUsuario(usuarioId, async (transaction) => {
      const actual = await repo.findByIdConLock(id, { transaction });
      if (!actual) throw { status: 404, message: 'Parqueadero no encontrado' };
      if (actual.estado === nuevoEstado) {
        throw { status: 409, message: `El parqueadero ya se encuentra ${nuevoEstado ? 'ACTIVO' : 'INACTIVO'}` };
      }

      return repo.cambiarEstado(id, nuevoEstado, { transaction });
    }, { motivo });

    return _conEstadoTexto(resultado);
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
