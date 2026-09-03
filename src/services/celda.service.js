/**
 * @module CeldaService
 * @description Lógica de negocio para la gestión de celdas de parqueo.
 * Alineado con el modelo Celda real (parqueadero, numero, tipo, usabilidad, estado).
 *
 * celda.estado es la ÚNICA fuente de verdad y la BD la protege con triggers de
 * auditoría/historial que exigen SET LOCAL app.usuario_id -- por eso create/update/
 * remove van envueltos en runWithUsuario. El cambio MANUAL de estado (mantenimiento,
 * inactivar) no se hace aquí: va por disponibilidad_celda, que además exige un motivo
 * (ver disponibilidad_celda.service.js). Los cambios automáticos de estado (ingreso,
 * salida, reservas) los hace la propia BD vía trigger cuando se escribe en
 * registro_acceso/reserva -- este service nunca debe tocar celda.estado directamente.
 */

const repo = require('../repositories/celda.repository');
const parqRepo = require('../repositories/parqueadero.repository');
const disponibilidadRepo = require('../repositories/disponibilidadCelda.repository');
const vehRepo = require('../repositories/vehiculo.repository');
const { runWithUsuario, traducirErrorTrigger } = require('../utils/dbContext.util');

const MOTIVO_AJUSTE_CANTIDADES = 'AJUSTE_OPERATIVO';

const TIPOS_PERMITIDOS = ['CARRO', 'MOTO', 'BICICLETA', 'CAMION', 'BUS'];
const USABILIDADES_PERMITIDAS = ['GENERAL', 'EJECUTIVO', 'MOVILIDAD_REDUCIDA', 'VEHICULO_SENA'];

// Prefijos de numeración automática para /generar-lote, uno por grupo pedido en el
// formulario de creación de parqueadero (fase 9): carro, moto y movilidad reducida
// (esta última es tipo CARRO con usabilidad MOVILIDAD_REDUCIDA -- no existe un tipo de
// celda propio para movilidad reducida, es una usabilidad sobre una celda de carro).
const GRUPOS_LOTE = {
  cantidadCarro: { prefijo: 'C', tipo: 'CARRO', usabilidad: 'GENERAL' },
  cantidadMoto: { prefijo: 'M', tipo: 'MOTO', usabilidad: 'GENERAL' },
  cantidadMovilidadReducida: { prefijo: 'PMR', tipo: 'CARRO', usabilidad: 'MOVILIDAD_REDUCIDA' },
};

/**
 * Obtiene todas las celdas registradas.
 * @returns {Promise<Array>} Lista de celdas.
 */
const getAll = () => repo.findAll();

/**
 * Busca una celda por su ID.
 * @param {number} id - ID de la celda.
 * @throws {Object} 404 si no existe.
 * @returns {Promise<Object>} Datos de la celda.
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Celda no encontrada' };
  return item;
};

/**
 * Filtra celdas por parqueadero.
 * @param {number} parqueaderoId
 * @returns {Promise<Array>}
 */
const getByParqueadero = (parqueaderoId) => repo.findByParqueadero(parqueaderoId);

/**
 * Obtiene celdas disponibles (estado = 'DISPONIBLE') en un parqueadero, opcionalmente
 * filtradas por el tipo de vehículo que va a ocuparlas.
 *
 * Sin filtro, esta consulta le ofrecía a una moto celdas de carro (y al revés): el usuario
 * elegía una, y el rechazo aparecía recién al reservar o al ingresar, cuando el trigger
 * comparaba los tipos. El filtro usa el mismo criterio de compatibilidad que reservas e
 * ingreso (compatibilidadVehiculo.util.js), no una regla propia.
 *
 * @param {number} parqueaderoId
 * @param {Object} [filtros]
 * @param {string} [filtros.tipo] - Tipo de celda pedido explícitamente.
 * @param {number} [filtros.vehiculo_id] - Alternativa a `tipo`: se deduce del vehículo.
 * @throws {Object} 400 si el tipo no es válido; 404 si el vehículo no existe.
 * @returns {Promise<Array>}
 */
const getDisponibles = async (parqueaderoId, { tipo, vehiculo_id } = {}) => {
  let tipoFiltro = tipo || null;

  if (vehiculo_id) {
    const vehiculo = await vehRepo.findById(vehiculo_id);
    if (!vehiculo) throw { status: 404, message: 'Vehículo no encontrado' };
    tipoFiltro = vehiculo.tipo;
  }

  if (tipoFiltro && !TIPOS_PERMITIDOS.includes(tipoFiltro)) {
    throw { status: 400, message: `Tipo inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }

  return repo.findDisponibles(parqueaderoId, tipoFiltro);
};

/**
 * Filtra celdas por tipo de vehículo.
 * @param {string} tipo - CARRO, MOTO, BICICLETA, CAMION, BUS
 * @returns {Promise<Array>}
 */
const getByTipo = async (tipo) => {
  if (!TIPOS_PERMITIDOS.includes(tipo)) {
    throw { status: 400, message: `Tipo no válido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }
  return repo.findByTipo(tipo);
};

/**
 * Filtra celdas por usabilidad.
 * @param {string} usabilidad - GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA, VEHICULO_SENA
 * @returns {Promise<Array>}
 */
const getByUsabilidad = async (usabilidad) => {
  if (!USABILIDADES_PERMITIDAS.includes(usabilidad)) {
    throw { status: 400, message: `Usabilidad no válida. Permitidas: ${USABILIDADES_PERMITIDAS.join(', ')}` };
  }
  return repo.findByUsabilidad(usabilidad);
};

/**
 * Crea una nueva celda validando existencia del parqueadero, valores permitidos
 * y unicidad de (parqueadero, numero).
 * @param {Object} data
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 400 si faltan datos o son inválidos; 404 si el parqueadero no existe; 409 si el número ya existe en ese parqueadero.
 * @returns {Promise<Object>} Celda creada.
 */
const create = async ({ parqueadero, numero, tipo, usabilidad = 'GENERAL', observaciones, posicion_x, posicion_y, ancho, alto }, usuarioId) => {
  if (!parqueadero) throw { status: 400, message: 'El parqueadero es requerido' };
  if (!numero) throw { status: 400, message: 'El número de la celda es requerido' };
  if (!tipo) throw { status: 400, message: 'El tipo es requerido' };

  if (!TIPOS_PERMITIDOS.includes(tipo)) {
    throw { status: 400, message: `Tipo inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }
  if (!USABILIDADES_PERMITIDAS.includes(usabilidad)) {
    throw { status: 400, message: `Usabilidad inválida. Permitidas: ${USABILIDADES_PERMITIDAS.join(', ')}` };
  }

  const existeParq = await parqRepo.findById(parqueadero);
  if (!existeParq) throw { status: 404, message: 'Parqueadero no encontrado' };

  const existeNumero = await repo.findByParqueaderoYNumero(parqueadero, numero);
  if (existeNumero) throw { status: 409, message: 'Ya existe una celda con ese número en ese parqueadero' };

  return runWithUsuario(usuarioId, (transaction) => repo.create(
    { parqueadero, numero, tipo, usabilidad, observaciones, posicion_x, posicion_y, ancho, alto },
    { transaction },
  ));
};

/**
 * Actualiza parcialmente una celda (atributos físicos; el estado no se toca aquí).
 * @param {number} id - ID de la celda.
 * @param {Object} data - Campos a actualizar (todos opcionales).
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 404 si la celda no existe; 400 si algún valor no es permitido; 409 si el número ya existe en ese parqueadero.
 * @returns {Promise<Object>} Celda actualizada.
 */
const update = async (id, data, usuarioId) => {
  const celda = await getById(id);

  if (data.tipo && !TIPOS_PERMITIDOS.includes(data.tipo)) {
    throw { status: 400, message: `Tipo inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }
  if (data.usabilidad && !USABILIDADES_PERMITIDAS.includes(data.usabilidad)) {
    throw { status: 400, message: `Usabilidad inválida. Permitidas: ${USABILIDADES_PERMITIDAS.join(', ')}` };
  }
  if (data.numero && data.numero !== celda.numero) {
    const existeNumero = await repo.findByParqueaderoYNumero(celda.parqueadero, data.numero);
    if (existeNumero && existeNumero.id !== Number(id)) {
      throw { status: 409, message: 'Ya existe una celda con ese número en ese parqueadero' };
    }
  }

  return runWithUsuario(usuarioId, (transaction) => repo.update(id, data, { transaction }));
};

/**
 * Genera en lote las celdas de un parqueadero recién creado (o para ampliarlo),
 * numerándolas automáticamente por prefijo (C-01, M-01, PMR-01...). Pensado para el
 * formulario simplificado de creación de parqueadero, que solo pide cantidades por tipo.
 * @param {number} parqueaderoId
 * @param {Object} cantidades - { cantidadCarro?, cantidadMoto?, cantidadMovilidadReducida? }
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 400 si las cantidades son inválidas o no se pidió ninguna celda; 404 si el parqueadero no existe.
 * @returns {Promise<Array<Object>>} Celdas creadas.
 */
const generarLote = async (parqueaderoId, cantidades, usuarioId) => {
  const existeParq = await parqRepo.findById(parqueaderoId);
  if (!existeParq) throw { status: 404, message: 'Parqueadero no encontrado' };

  const grupos = [];
  for (const [campo, { prefijo, tipo, usabilidad }] of Object.entries(GRUPOS_LOTE)) {
    const cantidad = cantidades?.[campo];
    if (cantidad === undefined || cantidad === null) continue;
    if (!Number.isInteger(cantidad) || cantidad < 0) {
      throw { status: 400, message: `${campo} debe ser un entero mayor o igual a 0` };
    }
    if (cantidad > 0) grupos.push({ prefijo, tipo, usabilidad, cantidad });
  }

  if (!grupos.length) {
    throw { status: 400, message: 'Debes indicar al menos una cantidad mayor a 0 (cantidadCarro, cantidadMoto o cantidadMovilidadReducida)' };
  }

  const nuevasTotal = grupos.reduce((acc, g) => acc + g.cantidad, 0);
  const actualTotal = await repo.contarTotalPorParqueadero(parqueaderoId);
  if (actualTotal + nuevasTotal > existeParq.capacidad_maxima) {
    throw {
      status: 409,
      message: `La capacidad máxima del parqueadero es ${existeParq.capacidad_maxima}; ya tiene ${actualTotal} celdas y se intentaron crear ${nuevasTotal} más`,
    };
  }

  return runWithUsuario(usuarioId, (transaction) => repo.generarLote(parqueaderoId, grupos, { transaction }));
};

/**
 * Ajusta las cantidades de celdas de un parqueadero ya existente a los valores deseados
 * por grupo (carro/moto/movilidad reducida) -- pensado para el formulario de edición de
 * parqueadero, que igual que el de creación solo pide cantidades por tipo.
 *
 * Si la cantidad deseada de un grupo es mayor a la actual, crea solo la diferencia
 * (misma numeración automática que generarLote). Si es menor, desactiva (nunca borra)
 * únicamente celdas que estén DISPONIBLE en ese momento -- nunca toca una celda
 * OCUPADA, RESERVADA o ya en MANTENIMIENTO/INACTIVA, y el histórico de esas celdas
 * (ocupaciones, ingresos, reservas, auditoría) queda intacto porque no se eliminan filas,
 * solo cambia su estado vía disponibilidad_celda. Si no hay suficientes celdas libres
 * para llegar exactamente a la cantidad pedida, desactiva las que sí puede y reporta
 * cuántas quedaron pendientes por estar en uso.
 * @param {number} parqueaderoId
 * @param {Object} cantidades - { cantidadCarro?, cantidadMoto?, cantidadMovilidadReducida? }
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría + motivo).
 * @throws {Object} 400 si las cantidades son inválidas o no se indicó ninguna; 404 si el parqueadero no existe.
 * @returns {Promise<Array<Object>>} Un resumen por grupo: { campo, actual, deseada, creadas, desactivadas, pendientesPorOcupacion }.
 */
const ajustarCantidades = async (parqueaderoId, cantidades, usuarioId) => {
  const existeParq = await parqRepo.findById(parqueaderoId);
  if (!existeParq) throw { status: 404, message: 'Parqueadero no encontrado' };

  const plan = [];
  for (const [campo, { prefijo, tipo, usabilidad }] of Object.entries(GRUPOS_LOTE)) {
    const deseada = cantidades?.[campo];
    if (deseada === undefined || deseada === null) continue;
    if (!Number.isInteger(deseada) || deseada < 0) {
      throw { status: 400, message: `${campo} debe ser un entero mayor o igual a 0` };
    }
    const actual = await repo.contarPorGrupoTipo(parqueaderoId, tipo, usabilidad);
    plan.push({ campo, prefijo, tipo, usabilidad, actual, deseada });
  }

  if (!plan.length) {
    throw { status: 400, message: 'Debes indicar al menos una cantidad (cantidadCarro, cantidadMoto o cantidadMovilidadReducida)' };
  }

  const cambioNeto = plan.reduce((acc, { actual, deseada }) => acc + (deseada - actual), 0);
  const actualTotalGlobal = await repo.contarTotalPorParqueadero(parqueaderoId);
  if (actualTotalGlobal + cambioNeto > existeParq.capacidad_maxima) {
    throw {
      status: 409,
      message: `La capacidad máxima del parqueadero es ${existeParq.capacidad_maxima}; el ajuste solicitado dejaría ${actualTotalGlobal + cambioNeto} celdas en total`,
    };
  }

  try {
    return await runWithUsuario(
      usuarioId,
      async (transaction) => {
        const resumen = [];
        for (const { campo, prefijo, tipo, usabilidad, actual, deseada } of plan) {
          if (deseada === actual) {
            resumen.push({ campo, actual, deseada, creadas: 0, desactivadas: 0, pendientesPorOcupacion: 0 });
            continue;
          }

          if (deseada > actual) {
            const creadas = await repo.generarLote(
              parqueaderoId,
              [{ prefijo, tipo, usabilidad, cantidad: deseada - actual }],
              { transaction },
            );
            resumen.push({ campo, actual, deseada, creadas: creadas.length, desactivadas: 0, pendientesPorOcupacion: 0 });
            continue;
          }

          const porQuitar = actual - deseada;
          const candidatas = await repo.findDesactivables(parqueaderoId, tipo, usabilidad, porQuitar, { transaction });
          for (const celda of candidatas) {
            await disponibilidadRepo.upsert(
              celda.id,
              {
                estado: 'INACTIVA',
                motivo: MOTIVO_AJUSTE_CANTIDADES,
                observacion: 'Reducción de cantidades del parqueadero',
                usuario_id: usuarioId,
              },
              { transaction },
            );
          }
          resumen.push({
            campo,
            actual,
            deseada,
            creadas: 0,
            desactivadas: candidatas.length,
            pendientesPorOcupacion: porQuitar - candidatas.length,
          });
        }
        return resumen;
      },
      { motivoDisponibilidad: MOTIVO_AJUSTE_CANTIDADES },
    );
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

/**
 * Reduce en `cantidad` las celdas de un parqueadero eligiendo el backend CUÁLES quitar,
 * de forma equilibrada entre tipos: en cada paso retira una celda del grupo que quede
 * más sobrerrepresentado (más celdas vigentes), de modo que la distribución final entre
 * carro / moto / movilidad reducida quede lo más pareja posible en vez de vaciar un solo
 * tipo. A diferencia de ajustarCantidades(), aquí el caller solo dice CUÁNTAS quitar.
 *
 * Solo son candidatas las celdas DISPONIBLE: nunca se toca una OCUPADA, RESERVADA ni una
 * ya retirada (reutiliza repo.findDesactivables, que ya filtra por DISPONIBLE). "Retirar"
 * es marcarla INACTIVA vía disponibilidad_celda, nunca un DELETE: así se conserva todo su
 * histórico (ocupaciones, ingresos, reservas) y deja de contar para la capacidad.
 * Todo ocurre en una sola transacción.
 * @param {number} parqueaderoId
 * @param {number} cantidad - Cuántas celdas se piden retirar (entero > 0).
 * @param {number} usuarioId - Usuario autenticado (auditoría + motivo).
 * @throws {Object} 400 si la cantidad es inválida; 404 si el parqueadero no existe.
 * @returns {Promise<Object>} Resumen: solicitadas, eliminadas, conservadas, motivo,
 *   cantidad_final, capacidad_maxima y el detalle por tipo.
 */
const reducirCeldas = async (parqueaderoId, cantidad, usuarioId) => {
  const existeParq = await parqRepo.findById(parqueaderoId);
  if (!existeParq) throw { status: 404, message: 'Parqueadero no encontrado' };
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw { status: 400, message: 'cantidad debe ser un entero mayor que 0' };
  }

  const totalVigenteInicial = await repo.contarTotalPorParqueadero(parqueaderoId);
  if (cantidad > totalVigenteInicial) {
    throw {
      status: 400,
      message: `No se pueden retirar ${cantidad} celdas: el parqueadero solo tiene ${totalVigenteInicial} vigentes`,
    };
  }

  // Estado inicial por grupo: cuántas hay vigentes y cuáles están libres (candidatas).
  const grupos = [];
  for (const [campo, { tipo, usabilidad }] of Object.entries(GRUPOS_LOTE)) {
    const vigentes = await repo.contarVigentesPorGrupoTipo(parqueaderoId, tipo, usabilidad);
    const libres = vigentes > 0 ? await repo.findDesactivables(parqueaderoId, tipo, usabilidad, vigentes) : [];
    grupos.push({ campo, tipo, usabilidad, vigentes, restantes: vigentes, cola: [...libres], retiradas: 0 });
  }

  // Selección equilibrada: siempre se quita del grupo con más celdas restantes que aún
  // tenga alguna libre; así se recorta primero lo sobrerrepresentado.
  const seleccionadas = [];
  for (let i = 0; i < cantidad; i += 1) {
    const candidatos = grupos.filter((g) => g.cola.length > 0);
    if (!candidatos.length) break; // ya no quedan celdas libres que retirar
    candidatos.sort((a, b) => b.restantes - a.restantes);
    const grupo = candidatos[0];
    seleccionadas.push(grupo.cola.shift());
    grupo.restantes -= 1;
    grupo.retiradas += 1;
  }

  try {
    await runWithUsuario(
      usuarioId,
      async (transaction) => {
        for (const celda of seleccionadas) {
          await disponibilidadRepo.upsert(
            celda.id,
            {
              estado: 'INACTIVA',
              motivo: MOTIVO_AJUSTE_CANTIDADES,
              observacion: 'Reducción equilibrada de celdas del parqueadero',
              usuario_id: usuarioId,
            },
            { transaction },
          );
        }
      },
      { motivoDisponibilidad: MOTIVO_AJUSTE_CANTIDADES },
    );
  } catch (error) {
    traducirErrorTrigger(error);
  }

  const eliminadas = seleccionadas.length;
  const conservadas = cantidad - eliminadas;
  return {
    solicitadas: cantidad,
    eliminadas,
    conservadas,
    motivo: conservadas === 0
      ? 'Se retiraron todas las celdas solicitadas.'
      : `No se pudieron retirar ${conservadas} celda(s): las restantes están ocupadas o reservadas y no se tocan hasta que se registre la salida o termine la reserva.`,
    cantidad_final: totalVigenteInicial - eliminadas,
    capacidad_maxima: existeParq.capacidad_maxima,
    detalle_por_tipo: grupos.map(({ campo, tipo, usabilidad, vigentes, retiradas, restantes }) => ({
      campo, tipo, usabilidad, antes: vigentes, retiradas, quedan: restantes,
    })),
    celdas_retiradas: seleccionadas.map((c) => ({ id: c.id, numero: c.numero, tipo: c.tipo, usabilidad: c.usabilidad })),
  };
};

/**
 * Elimina una celda del sistema.
 * @param {number} id - ID de la celda.
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 404 si no existe; 409 si está referenciada por reservas, ingresos u ocupaciones.
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
  getByParqueadero,
  getDisponibles,
  getByTipo,
  getByUsabilidad,
  create,
  update,
  generarLote,
  ajustarCantidades,
  reducirCeldas,
  remove,
};
