/**
 * @module EntradaSalidaService
 * @description Lógica de negocio para 'registro_acceso' (ingreso/salida de vehículos).
 *
 * Si el ingreso trae celda_id, el trigger fn_registro_ingreso_celda de la BD crea la
 * ocupacion_celda y pasa la celda a OCUPADA -- validando ahí mismo (fn_validar_ocupacion_celda)
 * que la celda no esté en MANTENIMIENTO/INACTIVA, que no tenga ya una ocupación activa, que el
 * tipo de vehículo corresponda y que las celdas preferenciales tengan un conductor con
 * movilidad reducida. Este service NO debe tocar celda.estado directamente: solo escribe en
 * registro_acceso dentro de una transacción con SET LOCAL app.usuario_id (runWithUsuario) y dejar
 * que la BD haga cascada. Los errores de esas validaciones llegan como RAISE EXCEPTION de
 * Postgres y se traducen a 409 con traducirErrorTrigger.
 */

const repo = require('../repositories/entradaSalida.repository');
const celdaRepo = require('../repositories/celda.repository');
const vehRepo = require('../repositories/vehiculo.repository');
const parqRepo = require('../repositories/parqueadero.repository');
const conductorRepo = require('../repositories/conductor.repository');
const { runWithUsuario, traducirErrorTrigger } = require('../utils/dbContext.util');
const { validarHorarioOperacion } = require('../config/horarioOperacion');

/**
 * Obtiene el historial completo de entradas y salidas.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca un registro específico por ID.
 * @param {number} id
 * @throws {Object} 404 si el registro no existe.
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Registro no encontrado' };
  return item;
};

/**
 * Filtra el historial por un vehículo específico.
 * @param {number} vehiculoId
 * @returns {Promise<Array>}
 */
const getByVehiculo = (vehiculoId) => repo.findByVehiculo(vehiculoId);

/**
 * Consulta registros dentro de un rango de fechas.
 * @param {string} desde - Fecha inicial (YYYY-MM-DD).
 * @param {string} hasta - Fecha final (YYYY-MM-DD).
 * @throws {Object} 400 si faltan parámetros de fecha.
 * @returns {Promise<Array>}
 */
const getByFecha = (desde, hasta) => {
  if (!desde || !hasta) throw { status: 400, message: 'desde y hasta son requeridos' };
  return repo.findByFecha(desde, hasta);
};

/**
 * Registra el ingreso de un vehículo. La BD valida (vía trigger) el estado de la celda,
 * el tipo de vehículo y las reglas de celdas preferenciales; aquí se resuelven los 404, que
 * el vehículo esté habilitado, que el conductor (si viene) sea dueño del vehículo, y el 409
 * de "vehículo ya adentro".
 * @param {Object} data
 * @param {number} usuarioId - Vigilante/administrador autenticado que registra el ingreso.
 * @throws {Object} 400 si faltan campos obligatorios.
 * @throws {Object} 404 si vehículo, parqueadero, celda o conductor no existen.
 * @throws {Object} 409 si el vehículo está deshabilitado, el conductor no es propietario del
 * vehículo, el vehículo ya tiene un ingreso abierto, o la BD rechaza la ocupación.
 * @returns {Promise<Object>} Registro de ingreso creado.
 */
const registrarIngreso = async ({ vehiculo_id, conductor_id, parqueadero_id, celda_id, reserva_id, descripcion_ingreso, fecha_hora_ingreso, es_oficial_sena }, usuarioId) => {
  if (!vehiculo_id) throw { status: 400, message: 'El vehículo es requerido' };
  if (!parqueadero_id) throw { status: 400, message: 'El parqueadero es requerido' };

  validarHorarioOperacion();

  const vehExiste = await vehRepo.findById(vehiculo_id);
  if (!vehExiste) throw { status: 404, message: 'Vehículo no encontrado' };
  if (!vehExiste.estado) {
    throw { status: 409, message: 'El vehículo está deshabilitado y no puede ingresar' };
  }

  const parqExiste = await parqRepo.findById(parqueadero_id);
  if (!parqExiste) throw { status: 404, message: 'Parqueadero no encontrado' };
  if (!parqExiste.estado) {
    throw { status: 409, message: 'El parqueadero se encuentra inactivo y no permite operaciones de estacionamiento.' };
  }

  if (celda_id) {
    const celdaExiste = await celdaRepo.findById(celda_id);
    if (!celdaExiste) throw { status: 404, message: 'Celda no encontrada' };
  }

  if (conductor_id) {
    const conductorExiste = await conductorRepo.findById(conductor_id);
    if (!conductorExiste) throw { status: 404, message: 'Conductor no encontrado' };
    // El conductor que ingresa debe ser (co)propietario del vehículo -- evita que un
    // vehículo quede asociado en el ingreso a una persona que no es dueña de él.
    const esPropietario = await vehRepo.findPropietario(vehiculo_id, conductor_id);
    if (!esPropietario) {
      throw { status: 409, message: 'El conductor indicado no es propietario de este vehículo' };
    }
  }

  const ingresoAbierto = await repo.findIngresoAbierto(vehiculo_id);
  if (ingresoAbierto) {
    throw { status: 409, message: 'El vehículo ya tiene un ingreso registrado sin salida' };
  }

  try {
    return await runWithUsuario(usuarioId, (transaction) => repo.registrarIngreso(
      { vehiculo_id, conductor_id, parqueadero_id, celda_id, reserva_id, usuario_ingreso_id: usuarioId, descripcion_ingreso, fecha_hora_ingreso, es_oficial_sena },
      { transaction },
    ));
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

/**
 * Registra la salida del ingreso abierto de un vehículo. La BD libera (o vuelve a
 * reservar) la celda automáticamente vía trigger.
 * @param {Object} data
 * @param {number} data.vehiculo_id
 * @param {string} [data.descripcion_salida]
 * @param {string} [data.fecha_hora_salida]
 * @param {number} usuarioId - Vigilante/administrador autenticado que registra la salida.
 * @throws {Object} 400 si falta el vehículo.
 * @throws {Object} 404 si el vehículo no existe.
 * @throws {Object} 409 si el vehículo no tiene un ingreso abierto.
 * @returns {Promise<Object>} Registro actualizado con la salida.
 */
const registrarSalida = async ({ vehiculo_id, descripcion_salida, fecha_hora_salida }, usuarioId) => {
  if (!vehiculo_id) throw { status: 400, message: 'El vehículo es requerido' };

  validarHorarioOperacion();

  const vehExiste = await vehRepo.findById(vehiculo_id);
  if (!vehExiste) throw { status: 404, message: 'Vehículo no encontrado' };

  const ingresoAbierto = await repo.findIngresoAbierto(vehiculo_id);
  if (!ingresoAbierto) {
    throw { status: 409, message: 'El vehículo no tiene un ingreso activo' };
  }

  try {
    return await runWithUsuario(usuarioId, (transaction) => repo.registrarSalida(
      ingresoAbierto.id,
      { usuario_salida_id: usuarioId, descripcion_salida, fecha_hora_salida },
      { transaction },
    ));
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

/**
 * Elimina un registro del historial (uso administrativo). No se puede borrar un ingreso que
 * ya generó ocupación de celda (o novedades/capturas de placa asociadas) -- es la barrera de
 * integridad referencial de la BD para no perder histórico; aquí solo se traduce a un 409
 * legible en vez de un 500 genérico.
 * @param {number} id
 * @param {number} usuarioId - Administrador autenticado que hace la operación (auditoría).
 * @throws {Object} 404 si no existe, 409 si está referenciado por otros registros.
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

module.exports = {
  getAll,
  getById,
  getByVehiculo,
  getByFecha,
  registrarIngreso,
  registrarSalida,
  remove,
};
