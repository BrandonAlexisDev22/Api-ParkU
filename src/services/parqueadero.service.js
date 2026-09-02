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
const entradaSalidaRepo = require('../repositories/entradaSalida.repository');
const reservaRepo = require('../repositories/reserva.repository');
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
    const creado = await runWithUsuario(usuarioId, (transaction) => repo.create({ ...data, acceso, tipo }, { transaction }));
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
 * Al DESACTIVAR (true -> false), ejecuta en la MISMA transacción una cascada que:
 *   1. Cierra (registra salida de) todos los ingresos activos del parqueadero -- el
 *      trigger de la BD libera la celda de cada uno solo, no se toca celda.estado a mano.
 *   2. Cancela todas las reservas PENDIENTE/ACEPTADA del parqueadero (vía su celda),
 *      registrando el mismo motivo, reutilizando reserva.repository.cambiarEstado tal
 *      cual (ya escribe motivo_rechazo y deja que fn_historial_reserva registre el motivo
 *      vía app.motivo, que este mismo runWithUsuario ya dejó seteado).
 * Si cualquier paso falla, sequelize.transaction revierte todo -- no queda nada a medias.
 * La fila del parqueadero se lee con lock (FOR UPDATE) para serializar dos
 * activaciones/desactivaciones concurrentes del mismo parqueadero.
 *
 * REACTIVAR (false -> true) no dispara ninguna cascada: no hay nada que "reabrir"
 * automáticamente (ingresos y reservas cerrados por la desactivación quedan como
 * histórico, tal como pide la regla de no perder información histórica).
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

      const actualizado = await repo.cambiarEstado(id, nuevoEstado, { transaction });

      if (nuevoEstado === false) {
        const ingresosActivos = await entradaSalidaRepo.findActivos(id, { transaction, lock: true });
        for (const ingreso of ingresosActivos) {
          await entradaSalidaRepo.registrarSalida(
            ingreso.id,
            { usuario_salida_id: usuarioId, descripcion_salida: `Cierre automático: parqueadero desactivado (${motivo})` },
            { transaction },
          );
        }

        const reservasActivas = await reservaRepo.findActivasPorParqueadero(id, { transaction, lock: true });
        for (const reserva of reservasActivas) {
          await reservaRepo.cambiarEstado(reserva.id, 'CANCELADA', usuarioId, motivo, { transaction });
        }
      }

      return actualizado;
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
