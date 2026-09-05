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

const { sequelize } = require('../config/database');
const repo = require('../repositories/entradaSalida.repository');
const celdaRepo = require('../repositories/celda.repository');
const vehRepo = require('../repositories/vehiculo.repository');
const parqRepo = require('../repositories/parqueadero.repository');
const conductorRepo = require('../repositories/conductor.repository');
const reservaRepo = require('../repositories/reserva.repository');
const { runWithUsuario, traducirErrorTrigger } = require('../utils/dbContext.util');
const { validarHorarioOperacion, horaEnBogotaTexto } = require('../config/horarioOperacion');
const { MARGEN_ESTACIONAR_ANTES_MINUTOS, MINUTO_MS, _enPalabras } = require('../config/reglasReserva');
const { validarCompatibilidadCelda } = require('../utils/compatibilidadVehiculo.util');

/**
 * Decide si este vehículo puede ocupar esta celda ahora mismo, mirando su AGENDA.
 *
 * Una reserva aparta una franja, no la celda entera (ver la migración 006). Así que hay dos
 * cosas que comprobar, y solo dos:
 *
 *  1. **Reserva vigente ahora**: entra exactamente quien reservó — mismo vehículo y mismo
 *     conductor. El trigger de la base compara el vehículo pero ignora al conductor: con la
 *     reserva de "Vehículo A + Conductor A", entrar con "Vehículo A + Conductor B" pasaba sin
 *     problema y el registro quedaba a nombre de quien no reservó.
 *  2. **Reserva próxima**: si la siguiente empieza dentro de menos del margen para
 *     estacionar, no se admite a nadie más — no da tiempo a usar la celda y desalojarla con
 *     orden. Quien SÍ tiene esa reserva puede entrar antes: es suya.
 *
 * @private
 * @param {Object} celda
 * @param {number} vehiculoId
 * @param {number} [conductorId]
 * @throws {Object} 409 si la celda está reservada ahora para otro, o si la próxima reserva
 *   está demasiado cerca.
 */
const _validarReservaDeCelda = async (celda, vehiculoId, conductorId) => {
  const ahora = new Date();

  const vigente = await reservaRepo.findVigenteEnCelda(celda.id, ahora);
  if (vigente) {
    if (vigente.vehiculo_id && vigente.vehiculo_id !== vehiculoId) {
      throw { status: 409, message: `La celda ${celda.numero} está reservada en este horario para otro vehículo` };
    }
    if (vigente.conductor_id && vigente.conductor_id !== conductorId) {
      throw {
        status: 409,
        message: conductorId
          ? `La celda ${celda.numero} está reservada en este horario para otro conductor`
          : `La celda ${celda.numero} está reservada: debes identificar al conductor de la reserva para registrar el ingreso`,
      };
    }
    return;
  }

  const proxima = await reservaRepo.findProximaEnCelda(celda.id, ahora);
  if (!proxima) return;
  // Quien tiene la próxima reserva puede llegar antes de su hora: la celda es suya.
  if (proxima.vehiculo_id === vehiculoId) return;

  const faltan = (new Date(proxima.fecha_hora_inicio).getTime() - ahora.getTime()) / MINUTO_MS;
  if (faltan < MARGEN_ESTACIONAR_ANTES_MINUTOS) {
    throw {
      status: 409,
      message: `La celda ${celda.numero} tiene una reserva a las ${horaEnBogotaTexto(new Date(proxima.fecha_hora_inicio))} y falta menos de ${_enPalabras(MARGEN_ESTACIONAR_ANTES_MINUTOS)}: no da tiempo a usarla y desalojarla. Elige otra celda.`,
    };
  }
};

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
  // Sin propietario no hay a quién responsabilizar de lo que pase con el vehículo dentro
  // del parqueadero. Antes solo se validaba la propiedad cuando el ingreso traía
  // conductor_id: un vehículo huérfano entraba sin más.
  if (!vehExiste.conductor_principal_id) {
    throw { status: 409, message: 'El vehículo no tiene conductor asociado: asígnale un propietario antes de registrar el ingreso' };
  }

  const parqExiste = await parqRepo.findById(parqueadero_id);
  if (!parqExiste) throw { status: 404, message: 'Parqueadero no encontrado' };
  if (!parqExiste.estado) {
    throw { status: 409, message: 'El parqueadero se encuentra inactivo y no permite operaciones de estacionamiento.' };
  }

  let celda = null;
  if (celda_id) {
    celda = await celdaRepo.findById(celda_id);
    if (!celda) throw { status: 404, message: 'Celda no encontrada' };
    // Mismo criterio que fn_validar_ocupacion_celda 3.4, pero aplicado antes de escribir:
    // un 409 legible en vez del RAISE EXCEPTION crudo de Postgres.
    validarCompatibilidadCelda(vehExiste, celda);
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

  // Agenda de la celda: quién puede entrar ahora y con cuánto margen (ver la función). Va
  // después de resolver el conductor para poder compararlo.
  if (celda) await _validarReservaDeCelda(celda, vehiculo_id, conductor_id);

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
    return await runWithUsuario(usuarioId, async (transaction) => {
      const registro = await repo.registrarSalida(
        ingresoAbierto.id,
        { usuario_salida_id: usuarioId, descripcion_salida, fecha_hora_salida },
        { transaction },
      );

      // Si este ingreso venía de una reserva, su hora de fin pasa a ser la salida real: el
      // historial decía "hasta las 12:00" aunque el vehículo se hubiera ido a las 10:20, y
      // esa hora es la que se lee después para saber cuánto estuvo ocupada la celda.
      await cerrarReservaDelIngreso(ingresoAbierto, transaction);

      return registro;
    });
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

/**
 * Cierra la reserva que respaldaba un ingreso: le pone como hora de fin la salida real, para
 * que el historial no diga "hasta las 12:00" cuando el vehículo se fue a las 10:20.
 *
 * Solo toca la reserva que de verdad se usó — la que el ingreso tiene apuntada, o en su
 * defecto la de esa celda y ese vehículo que cubría el momento de la salida — y solo si la
 * salida es ANTES de la hora que tenía: alargar una reserva por una salida tardía pisaría la
 * franja de quien viniera después.
 *
 * La hora de salida se toma de la propia fila de `registro_acceso` en vez de mandarla desde
 * JavaScript: las dos columnas son `timestamp` sin zona horaria, así que comparándolas entre
 * sí no hay forma de que una llegue en hora local y la otra en UTC (que es justo lo que
 * pasaba, y hacía que la condición nunca se cumpliera).
 *
 * @private
 * @param {Object} ingreso - El registro de acceso que se acaba de cerrar.
 * @param {import('sequelize').Transaction} transaction
 * @returns {Promise<void>}
 */
const cerrarReservaDelIngreso = async (ingreso, transaction) => {
  const reservaId = ingreso.reserva_id ?? null;
  const celdaId = ingreso.celda_id ?? null;
  if (!reservaId && (!celdaId || !ingreso.vehiculo_id)) return;

  const condicion = reservaId
    ? { sql: 'r.id = :reserva', datos: { reserva: reservaId } }
    : { sql: 'r.celda_id = :celda AND r.vehiculo_id = :vehiculo', datos: { celda: celdaId, vehiculo: ingreso.vehiculo_id } };

  await sequelize.query(
    `UPDATE reserva r
        SET fecha_hora_fin = ra.fecha_hora_salida
       FROM registro_acceso ra
      WHERE ra.id = :ingreso
        AND ra.fecha_hora_salida IS NOT NULL
        AND ${condicion.sql}
        AND r.estado IN ('TERMINADA', 'ACEPTADA')
        AND r.fecha_hora_fin > ra.fecha_hora_salida
        AND r.fecha_hora_inicio <= ra.fecha_hora_salida`,
    { replacements: { ingreso: ingreso.id, ...condicion.datos }, transaction },
  );
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
