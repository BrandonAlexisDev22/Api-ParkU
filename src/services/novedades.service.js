/**
 * @module NovedadService
 * @description Lógica de negocio para la gestión de novedades.
 * Alineado con el modelo Novedad.
 */

const repo = require('../repositories/novedades.repository');
const vehRepo = require('../repositories/vehiculo.repository');
const movimientoRepo = require('../repositories/entradaSalida.repository'); // asumiendo que existe
const usuarioRepo = require('../repositories/usuario.repository');

/**
 * @swagger
 * components:
 *   schemas:
 *     Novedad:
 *       type: object
 *       required:
 *         - descripcion
 *       properties:
 *         id:
 *           type: integer
 *         vehiculo:
 *           type: integer
 *           nullable: true
 *         encargado:
 *           type: integer
 *           nullable: true
 *         descripcion:
 *           type: string
 *         evidencia:
 *           type: string
 *           nullable: true
 *         ingreso_salida:
 *           type: integer
 *           nullable: true
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *         tipo_novedad:
 *           type: string
 *           enum: [DAÑO, ACCIDENTE, MAL_ESTACIONAMIENTO, QUEJA, OTRO]
 *         prioridad:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA, CRITICA]
 *         estado:
 *           type: boolean
 *           description: true = pendiente, false = resuelta
 *         vehiculo_placa:
 *           type: string
 *           description: Solo lectura
 *         encargado_nombre:
 *           type: string
 *           description: Solo lectura
 *         movimiento_info:
 *           type: string
 *           description: Solo lectura
 *     NovedadCreate:
 *       type: object
 *       required:
 *         - descripcion
 *       properties:
 *         vehiculo:
 *           type: integer
 *           nullable: true
 *         encargado:
 *           type: integer
 *           nullable: true
 *         descripcion:
 *           type: string
 *         evidencia:
 *           type: string
 *           nullable: true
 *         ingreso_salida:
 *           type: integer
 *           nullable: true
 *         tipo_novedad:
 *           type: string
 *           enum: [DAÑO, ACCIDENTE, MAL_ESTACIONAMIENTO, QUEJA, OTRO]
 *           default: OTRO
 *         prioridad:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA, CRITICA]
 *           default: MEDIA
 *         estado:
 *           type: boolean
 *           default: true
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *           description: Opcional, si no se envía se usa la actual
 *     NovedadUpdate:
 *       type: object
 *       properties:
 *         vehiculo:
 *           type: integer
 *           nullable: true
 *         encargado:
 *           type: integer
 *           nullable: true
 *         descripcion:
 *           type: string
 *         evidencia:
 *           type: string
 *           nullable: true
 *         ingreso_salida:
 *           type: integer
 *           nullable: true
 *         tipo_novedad:
 *           type: string
 *           enum: [DAÑO, ACCIDENTE, MAL_ESTACIONAMIENTO, QUEJA, OTRO]
 *         prioridad:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA, CRITICA]
 *         estado:
 *           type: boolean
 */

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
 * Obtiene novedades por movimiento.
 * @param {number} movimientoId
 * @returns {Promise<Array>}
 */
const getByMovimiento = (movimientoId) => repo.findByMovimiento(movimientoId);

/**
 * Filtra novedades por tipo, prioridad y/o estado.
 * @param {Object} filtros
 * @returns {Promise<Array>}
 */
const getByFiltros = (filtros) => repo.findByFiltros(filtros);

/**
 * Crea una nueva novedad validando las entidades relacionadas.
 * @param {Object} data - Datos de la novedad
 * @throws {Object} 400 si falta descripción, 404 si vehículo/movimiento/encargado no existen.
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  const { descripcion, vehiculo, encargado, ingreso_salida } = data;
  if (!descripcion) {
    throw { status: 400, message: 'La descripción es requerida' };
  }

  // Validar vehículo si se proporciona
  if (vehiculo) {
    const veh = await vehRepo.findById(vehiculo);
    if (!veh) throw { status: 404, message: 'Vehículo no encontrado' };
  }

  // Validar movimiento si se proporciona
  if (ingreso_salida) {
    const mov = await movimientoRepo.findById(ingreso_salida);
    if (!mov) throw { status: 404, message: 'Movimiento no encontrado' };
  }

  // Validar encargado si se proporciona (asumiendo que es ID de usuario)
  if (encargado) {
    const user = await usuarioRepo.findById(encargado);
    if (!user) throw { status: 404, message: 'Usuario encargado no encontrado' };
  }

  // Si no se envía fecha_hora, se usa la actual
  const fecha = data.fecha_hora || new Date();

  return repo.create({
    vehiculo,
    encargado,
    descripcion,
    evidencia: data.evidencia || null,
    ingreso_salida,
    tipo_novedad: data.tipo_novedad || 'OTRO',
    prioridad: data.prioridad || 'MEDIA',
    estado: data.estado !== undefined ? data.estado : true,
    fecha_hora: fecha
  });
};

/**
 * Actualiza una novedad (parcial).
 * @param {number} id
 * @param {Object} data - Campos a actualizar
 * @throws {Object} 404 si no existe, 404 si entidad relacionada no existe.
 * @returns {Promise<Object>}
 */
const update = async (id, data) => {
  await getById(id);

  // Validar nuevas referencias si se envían
  if (data.vehiculo) {
    const veh = await vehRepo.findById(data.vehiculo);
    if (!veh) throw { status: 404, message: 'Vehículo no encontrado' };
  }
  if (data.ingreso_salida) {
    const mov = await movimientoRepo.findById(data.ingreso_salida);
    if (!mov) throw { status: 404, message: 'Movimiento no encontrado' };
  }
  if (data.encargado) {
    const user = await usuarioRepo.findById(data.encargado);
    if (!user) throw { status: 404, message: 'Usuario encargado no encontrado' };
  }

  return repo.update(id, data);
};

/**
 * Elimina una novedad.
 * @param {number} id
 * @throws {Object} 404 si no existe.
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = {
  getAll,
  getById,
  getByVehiculo,
  getByMovimiento,
  getByFiltros,
  create,
  update,
  remove,
};