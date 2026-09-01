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
const { runWithUsuario, traducirErrorTrigger } = require('../utils/dbContext.util');

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
 * Obtiene celdas disponibles (estado = 'DISPONIBLE') en un parqueadero.
 * @param {number} parqueaderoId
 * @returns {Promise<Array>}
 */
const getDisponibles = (parqueaderoId) => repo.findDisponibles(parqueaderoId);

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

  return runWithUsuario(usuarioId, (transaction) => repo.generarLote(parqueaderoId, grupos, { transaction }));
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
  remove,
};
