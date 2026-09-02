/**
 * @module MonitoreoService
 * @description Vista consolidada y en tiempo real del estado del parqueadero: qué celdas
 * están libres/ocupadas, quién ocupa cada una, desde cuándo, y si ya superó el horario de
 * cierre. No introduce datos nuevos ni un estado paralelo: compone lo que ya exponen
 * celda.repository, entradaSalida.repository (ingresos activos) y novedades.repository,
 * reutilizándolos tal cual. celda.estado sigue siendo la única fuente de verdad de si una
 * celda está libre -- este módulo solo añade el detalle de quién la ocupa y por cuánto tiempo.
 */

const celdaRepo = require('../repositories/celda.repository');
const entradaSalidaRepo = require('../repositories/entradaSalida.repository');
const novedadesRepo = require('../repositories/novedades.repository');
const { runWithUsuario } = require('../utils/dbContext.util');
const { estaDentroDeHorarioOperacion, minutosFueraDeHorario } = require('../config/horarioOperacion');

// Una novedad en cualquiera de estos estados ya "se resolvió" -- no cuenta como incidente
// abierto a efectos de evitar duplicados.
const ESTADOS_NOVEDAD_CERRADOS = ['RESUELTA', 'CERRADA', 'CANCELADA'];

const _minutosDesde = (fecha) => Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 60000));

/**
 * Arma el detalle de ocupación de un ingreso activo (registro_acceso sin salida): vehículo,
 * conductor y los tiempos que pide el monitoreo.
 * @private
 * @param {Object} activo - Fila de entradaSalidaRepo.findActivos().
 * @returns {Object}
 */
const _detalleOcupacion = (activo) => {
  const ahora = new Date();
  return {
    registro_acceso_id: activo.id,
    fecha_hora_ingreso: activo.fecha_hora_ingreso,
    hora_actual: ahora,
    tiempo_permanencia_minutos: _minutosDesde(activo.fecha_hora_ingreso),
    fuera_de_horario: !estaDentroDeHorarioOperacion(ahora),
    minutos_excedidos: minutosFueraDeHorario(ahora),
    vehiculo: activo.vehiculo ? {
      id: activo.vehiculo.id,
      placa: activo.vehiculo.placa,
      tipo: activo.vehiculo.tipo,
    } : null,
    conductor: activo.conductor ? {
      id: activo.conductor.id,
      tipo_documento: activo.conductor.tipo_documento,
      numero_documento: activo.conductor.numero_documento,
      nombre: activo.conductor.nombre_apellidos,
      correo: activo.conductor.correo,
      telefono: activo.conductor.numero_telefonico,
    } : null,
    parqueadero: activo.parqueadero ? { id: activo.parqueadero.id, nombre: activo.parqueadero.nombre } : null,
    celda: activo.celda ? { id: activo.celda.id, numero: activo.celda.numero } : null,
  };
};

/**
 * Estado en vivo de las celdas (de un parqueadero, o de todos): disponible/ocupada/etc.,
 * y si está ocupada, quién la ocupa y desde cuándo.
 * @param {number} [parqueaderoId]
 * @returns {Promise<Array>}
 */
const getCeldas = async (parqueaderoId) => {
  const [celdas, activos] = await Promise.all([
    parqueaderoId ? celdaRepo.findByParqueadero(parqueaderoId) : celdaRepo.findAll(),
    entradaSalidaRepo.findActivos(parqueaderoId),
  ]);

  const activoPorCelda = new Map();
  for (const activo of activos) {
    if (activo.celda_id) activoPorCelda.set(activo.celda_id, activo);
  }

  return celdas.map((celda) => {
    const activo = activoPorCelda.get(celda.id);
    const ocupacion = activo ? _detalleOcupacion(activo) : null;
    return {
      id: celda.id,
      parqueadero_id: celda.parqueadero,
      parqueadero_nombre: celda.parqueadero_nombre,
      numero: celda.numero,
      tipo: celda.tipo,
      usabilidad: celda.usabilidad,
      estado: celda.estado,
      // Coordenadas/tamaño para que el frontend dibuje el plano -- misma fuente (celda)
      // que usa el listado simple de /api/celdas, así plano y lista nunca se desincronizan.
      posicion_x: celda.posicion_x,
      posicion_y: celda.posicion_y,
      ancho: celda.ancho,
      alto: celda.alto,
      ocupacion: ocupacion ? {
        registro_acceso_id: ocupacion.registro_acceso_id,
        fecha_hora_ingreso: ocupacion.fecha_hora_ingreso,
        tiempo_permanencia_minutos: ocupacion.tiempo_permanencia_minutos,
        fuera_de_horario: ocupacion.fuera_de_horario,
        vehiculo: ocupacion.vehiculo,
        conductor: ocupacion.conductor,
      } : null,
    };
  });
};

/**
 * Ingresos activos (sin salida) que ya superaron el horario de cierre. Se calcula al vuelo
 * contra la hora real -- no depende de ningún proceso en segundo plano.
 * @param {number} [parqueaderoId]
 * @returns {Promise<Array>}
 */
const getFueraDeHorario = async (parqueaderoId) => {
  const activos = await entradaSalidaRepo.findActivos(parqueaderoId);
  if (estaDentroDeHorarioOperacion(new Date())) return [];
  return activos.map(_detalleOcupacion);
};

/**
 * Revisa los ingresos activos fuera de horario y crea una novedad (MAL_ESTACIONAMIENTO,
 * prioridad ALTA) para cada uno que todavía no tenga un incidente abierto -- si ya existe una
 * novedad no cerrada ligada a ese registro_acceso_id, no crea otra. La barrera definitiva
 * contra duplicados por llamadas concurrentes es el índice único
 * uq_novedad_activa_por_registro en la base de datos (ver database/parku.postgres); si dos
 * llamadas chocan, la segunda simplemente detecta que ya quedó creada.
 * @param {number} usuarioId - Vigilante/administrador autenticado (auditoría + usuario_reporta_id).
 * @param {number} [parqueaderoId]
 * @returns {Promise<{creadas: Array, yaExistian: Array}>}
 */
const detectarIncidentesFueraDeHorario = async (usuarioId, parqueaderoId) => {
  const fueraDeHorario = await getFueraDeHorario(parqueaderoId);
  const creadas = [];
  const yaExistian = [];

  for (const item of fueraDeHorario) {
    const previas = await novedadesRepo.findByRegistroAcceso(item.registro_acceso_id);
    const abierta = previas.find((n) => !ESTADOS_NOVEDAD_CERRADOS.includes(n.estado));

    if (abierta) {
      yaExistian.push({ registro_acceso_id: item.registro_acceso_id, novedad_id: abierta.id });
      continue;
    }

    try {
      const placa = item.vehiculo?.placa || `vehículo #${item.vehiculo?.id}`;
      const descripcion = `${placa} sigue estacionado ${item.minutos_excedidos} min después del `
        + 'horario de cierre (detección automática de monitoreo).';

      const novedad = await runWithUsuario(usuarioId, (transaction) => novedadesRepo.create(
        {
          tipo_novedad: 'MAL_ESTACIONAMIENTO',
          prioridad: 'ALTA',
          descripcion,
          usuario_reporta_id: usuarioId,
          vehiculo_id: item.vehiculo?.id || null,
          celda_id: item.celda?.id || null,
          parqueadero_id: item.parqueadero?.id || null,
          registro_acceso_id: item.registro_acceso_id,
        },
        { transaction },
      ));
      creadas.push(novedad);
    } catch (error) {
      const codigo = error?.parent?.code || error?.original?.code;
      if (codigo === '23505') {
        // uq_novedad_activa_por_registro: otra llamada concurrente ya la creó primero.
        yaExistian.push({ registro_acceso_id: item.registro_acceso_id });
        continue;
      }
      throw error;
    }
  }

  return { creadas, yaExistian };
};

module.exports = { getCeldas, getFueraDeHorario, detectarIncidentesFueraDeHorario };
