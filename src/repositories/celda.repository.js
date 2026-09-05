/**
 * @module CeldaRepository
 * @description Operaciones de base de datos para la tabla 'celda' usando Sequelize.
 * Incluye JOIN con parqueadero para obtener el nombre de la sede.
 *
 * celda.estado lo mueven los triggers de la BD (ingreso/salida, reservas). Las
 * escrituras de create/update/cambiarEstado deben ir dentro de una transacción con
 * SET LOCAL app.usuario_id -- ver src/utils/dbContext.util.js y celda.service.js.
 */

const { Celda, Parqueadero } = require('../models');
const { Op } = require('sequelize');

/**
 * Aplana el resultado de Sequelize para mantener el mismo shape
 * que tenía la versión anterior con SQL manual (parqueadero_nombre plano).
 * @param {import('sequelize').Model} instancia
 * @returns {Object|null}
 */
const mapCelda = (instancia) => {
  if (!instancia) return null;
  const plano = instancia.toJSON();
  const { Parqueadero: parq, ...resto } = plano;
  return {
    ...resto,
    parqueadero_nombre: parq ? parq.nombre : null,
  };
};

const includeParqueadero = {
  model: Parqueadero,
  as: 'Parqueadero',
  attributes: ['nombre'],
};

/**
 * Recupera todas las celdas del sistema.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const rows = await Celda.findAll({ include: [includeParqueadero], order: [['parqueadero_id', 'ASC'], ['numero', 'ASC']] });
  return rows.map(mapCelda);
};

/**
 * Busca una celda por su identificador.
 * @param {number} id
 * @param {import('sequelize').Transaction} [opciones.transaction] - Pasarla cuando se llama
 *   justo después de un create/update en la misma transacción: si no, esta lectura sale por
 *   otra conexión del pool y no ve la fila todavía sin confirmar (queda en null).
 * @returns {Promise<Object|null>}
 */
const findById = async (id, { transaction } = {}) => {
  const row = await Celda.findByPk(id, { include: [includeParqueadero], transaction });
  return mapCelda(row);
};

/**
 * Busca una celda por parqueadero + número (clave única compuesta).
 * @param {number} parqueaderoId
 * @param {string} numero
 * @returns {Promise<Object|null>}
 */
const findByParqueaderoYNumero = async (parqueaderoId, numero) => {
  const row = await Celda.findOne({ where: { parqueadero: parqueaderoId, numero }, include: [includeParqueadero] });
  return mapCelda(row);
};

/**
 * Obtiene todas las celdas de un parqueadero específico.
 * @param {number} parqueaderoId
 * @returns {Promise<Array>}
 */
const findByParqueadero = async (parqueaderoId) => {
  const rows = await Celda.findAll({
    where: { parqueadero: parqueaderoId },
    include: [includeParqueadero],
    order: [['numero', 'ASC']],
  });
  return rows.map(mapCelda);
};

/**
 * Filtra celdas disponibles (estado = 'DISPONIBLE') en un parqueadero.
 * @param {number} parqueaderoId
 * @returns {Promise<Array>}
 */
const findDisponibles = async (parqueaderoId, tipo = null) => {
  const rows = await Celda.findAll({
    where: { parqueadero: parqueaderoId, estado: 'DISPONIBLE', ...(tipo && { tipo }) },
    include: [includeParqueadero],
    order: [['numero', 'ASC']],
  });
  return rows.map(mapCelda);
};

/**
 * Filtra celdas por tipo de vehículo.
 * @param {string} tipo
 * @returns {Promise<Array>}
 */
const findByTipo = async (tipo) => {
  const rows = await Celda.findAll({ where: { tipo }, include: [includeParqueadero] });
  return rows.map(mapCelda);
};

/**
 * Filtra celdas por usabilidad.
 * @param {string} usabilidad
 * @returns {Promise<Array>}
 */
const findByUsabilidad = async (usabilidad) => {
  const rows = await Celda.findAll({ where: { usabilidad }, include: [includeParqueadero] });
  return rows.map(mapCelda);
};

/**
 * Crea una nueva celda en la base de datos.
 * @param {Object} data
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<Object>}
 */
const create = async ({ parqueadero, numero, tipo, usabilidad, estado = 'DISPONIBLE', observaciones, posicion_x, posicion_y, ancho, alto }, { transaction } = {}) => {
  const nueva = await Celda.create(
    { parqueadero, numero, tipo, usabilidad, estado, observaciones, posicion_x, posicion_y, ancho, alto },
    { transaction }
  );
  return findById(nueva.id, { transaction });
};

/**
 * Actualiza parcialmente una celda existente (no toca estado; usar cambiarEstado).
 * @param {number} id
 * @param {Object} data
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<Object>}
 */
const update = async (id, data, { transaction } = {}) => {
  const allowedFields = ['numero', 'tipo', 'usabilidad', 'observaciones', 'posicion_x', 'posicion_y', 'ancho', 'alto'];
  const cambios = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) cambios[field] = data[field];
  }

  if (Object.keys(cambios).length === 0) {
    return findById(id, { transaction });
  }

  await Celda.update(cambios, { where: { id }, transaction });
  return findById(id, { transaction });
};

/**
 * Cambia el estado operativo de una celda (DISPONIBLE/MANTENIMIENTO/INACTIVA...).
 * Requiere contexto de usuario (ver celda.service.js) porque dispara auditoría e historial.
 * @param {number} id
 * @param {string} estado
 * @param {import('sequelize').Transaction} opciones.transaction
 * @returns {Promise<Object>}
 */
const cambiarEstado = async (id, estado, { transaction } = {}) => {
  await Celda.update({ estado }, { where: { id }, transaction });
  return findById(id, { transaction });
};

/**
 * Retiene una celda para una reserva aceptada. Como en `liberarSiEstaReservada`, la
 * condición viaja en el UPDATE: si la celda no está libre (hay un vehículo dentro, o está
 * en mantenimiento) no se toca, exactamente igual que hace el trigger al aceptar.
 * @param {number} id
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<boolean>} true si de verdad quedó reservada.
 */
const reservarSiEstaDisponible = async (id, { transaction } = {}) => {
  const [filas] = await Celda.update(
    { estado: 'RESERVADA' },
    { where: { id, estado: 'DISPONIBLE' }, transaction },
  );
  return filas > 0;
};

/**
 * Suelta una celda que estaba retenida por una reserva. La condición `estado = 'RESERVADA'`
 * va en el propio UPDATE, igual que en el trigger fn_reserva_bloquea_celda: si mientras
 * tanto la celda pasó a OCUPADA (llegó un vehículo) o a MANTENIMIENTO, no se toca.
 * @param {number} id
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<boolean>} true si de verdad se liberó.
 */
const liberarSiEstaReservada = async (id, { transaction } = {}) => {
  const [filas] = await Celda.update(
    { estado: 'DISPONIBLE' },
    { where: { id, estado: 'RESERVADA' }, transaction },
  );
  return filas > 0;
};

/**
 * Calcula, dentro de una lista de números ya usados, el mayor consecutivo de un
 * prefijo dado (numero = "PREFIJO-NN"). Devuelve 0 si el prefijo no se ha usado.
 * @private
 * @param {string[]} numerosExistentes
 * @param {string} prefijo
 * @returns {number}
 */
const _maxNumeroPorPrefijo = (numerosExistentes, prefijo) => {
  const regex = new RegExp(`^${prefijo}-(\\d+)$`);
  let max = 0;
  for (const numero of numerosExistentes) {
    const match = regex.exec(numero);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return max;
};

/**
 * Crea varias celdas de un parqueadero en una sola transacción, numerándolas
 * automáticamente por prefijo a partir del consecutivo libre más alto ya usado
 * (p. ej. si ya existen C-01..C-03, el siguiente grupo CARRO empieza en C-04).
 * @param {number} parqueaderoId
 * @param {Array<{prefijo:string, tipo:string, usabilidad:string, cantidad:number}>} grupos
 * @param {import('sequelize').Transaction} opciones.transaction
 * @returns {Promise<Array<Object>>} Celdas creadas, en el mismo orden de los grupos.
 */
const generarLote = async (parqueaderoId, grupos, { transaction } = {}) => {
  const existentes = await Celda.findAll({
    where: { parqueadero: parqueaderoId },
    attributes: ['numero'],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  const numeros = existentes.map((c) => c.numero);

  const nuevas = [];
  for (const { prefijo, tipo, usabilidad, cantidad } of grupos) {
    let siguiente = _maxNumeroPorPrefijo(numeros, prefijo) + 1;
    for (let i = 0; i < cantidad; i++) {
      const numero = `${prefijo}-${String(siguiente).padStart(2, '0')}`;
      numeros.push(numero);
      nuevas.push({ parqueadero: parqueaderoId, numero, tipo, usabilidad, estado: 'DISPONIBLE' });
      siguiente++;
    }
  }

  if (!nuevas.length) return [];

  await Celda.bulkCreate(nuevas, { transaction });
  const rows = await Celda.findAll({
    where: { parqueadero: parqueaderoId, numero: { [Op.in]: nuevas.map((n) => n.numero) } },
    include: [includeParqueadero],
    transaction,
    order: [['numero', 'ASC']],
  });
  return rows.map(mapCelda);
};

/**
 * Cuenta cuántas celdas de un tipo+usabilidad existen ya en un parqueadero (sin importar
 * su estado). Base para saber cuánto crear o desactivar al ajustar cantidades.
 * @param {number} parqueaderoId
 * @param {string} tipo
 * @param {string} usabilidad
 * @returns {Promise<number>}
 */
const contarPorGrupoTipo = (parqueaderoId, tipo, usabilidad) =>
  Celda.count({ where: { parqueadero: parqueaderoId, tipo, usabilidad } });

/**
 * Cuenta las celdas VIGENTES de un parqueadero (todos los tipos/usabilidades), es decir
 * excluyendo las retiradas por una reducción (estado INACTIVA) -- es el total que se
 * compara contra parqueadero.capacidad_maxima. Se excluyen las INACTIVA a propósito: una
 * celda retirada no ocupa capacidad, y si contara, reducir celdas nunca liberaría cupo
 * (las filas nunca se borran, para no perder su histórico).
 * @param {number} parqueaderoId
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<number>}
 */
const contarTotalPorParqueadero = (parqueaderoId, { transaction } = {}) =>
  Celda.count({ where: { parqueadero: parqueaderoId, estado: { [Op.ne]: 'INACTIVA' } }, transaction });

/**
 * Igual que contarPorGrupoTipo pero excluyendo las celdas retiradas (INACTIVA), para que
 * los conteos por grupo usados en la reducción equilibrada sean coherentes con
 * contarTotalPorParqueadero.
 * @param {number} parqueaderoId
 * @param {string} tipo
 * @param {string} usabilidad
 * @returns {Promise<number>}
 */
const contarVigentesPorGrupoTipo = (parqueaderoId, tipo, usabilidad) =>
  Celda.count({ where: { parqueadero: parqueaderoId, tipo, usabilidad, estado: { [Op.ne]: 'INACTIVA' } } });

/**
 * Celdas DISPONIBLES (nunca ocupadas/reservadas/ya inactivas) de un tipo+usabilidad en un
 * parqueadero, las de número más alto primero -- candidatas seguras para desactivar cuando
 * se reduce la cantidad deseada, priorizando las añadidas más recientemente.
 * @param {number} parqueaderoId
 * @param {string} tipo
 * @param {string} usabilidad
 * @param {number} limite - Máximo de celdas a devolver.
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<Array>}
 */
const findDesactivables = async (parqueaderoId, tipo, usabilidad, limite, { transaction } = {}) => {
  const rows = await Celda.findAll({
    where: { parqueadero: parqueaderoId, tipo, usabilidad, estado: 'DISPONIBLE' },
    order: [['numero', 'DESC']],
    limit: limite,
    transaction,
  });
  return rows.map((r) => r.toJSON());
};

/**
 * Elimina una celda de la base de datos.
 * @param {number} id
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<boolean>}
 */
const remove = async (id, { transaction } = {}) => {
  const filasEliminadas = await Celda.destroy({ where: { id }, transaction });
  return filasEliminadas > 0;
};

module.exports = {
  findAll,
  findById,
  findByParqueaderoYNumero,
  findByParqueadero,
  findDisponibles,
  findByTipo,
  findByUsabilidad,
  create,
  update,
  cambiarEstado,
  reservarSiEstaDisponible,
  liberarSiEstaReservada,
  generarLote,
  contarPorGrupoTipo,
  contarVigentesPorGrupoTipo,
  contarTotalPorParqueadero,
  findDesactivables,
  remove,
};
