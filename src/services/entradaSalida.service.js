/**
 * @module EntradaSalidaService
 * @description Gestión de flujos de acceso. Controla el registro de movimientos y la actualización de disponibilidad de celdas.
 */

const repo       = require('../repositories/entradaSalida.repository');
const celdaRepo  = require('../repositories/celda.repository');
const vehRepo    = require('../repositories/vehiculo.repository');

/**
 * @swagger
 * components:
 * schemas:
 * EntradaSalida:
 * type: object
 * required:
 * - tipo
 * - celda
 * - vehiculo
 * properties:
 * id:
 * type: integer
 * description: ID único del registro de movimiento.
 * tipo:
 * type: string
 * enum: [entrada, salida]
 * description: Tipo de movimiento registrado.
 * celda:
 * type: integer
 * description: ID de la celda involucrada.
 * vehiculo:
 * type: integer
 * description: ID del vehículo que realiza el movimiento.
 * descripcion:
 * type: string
 * description: Notas adicionales o estado del vehículo al ingresar/salir.
 * fecha_hora:
 * type: string
 * format: date-time
 * description: Estampa de tiempo del registro (generada por la BD).
 */

/**
 * Obtiene el historial completo de entradas y salidas.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca un registro específico por ID.
 * @param {number} id 
 * @throws {Object} 404 si el registro no existe.
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Registro no encontrado' };
  return item;
};

/**
 * Filtra el historial por un vehículo específico.
 * @param {number} vehiculoId 
 */
const getByVehiculo = (vehiculoId) => repo.findByVehiculo(vehiculoId);

/**
 * Consulta registros dentro de un rango de fechas.
 * @param {string} desde - Fecha inicial (YYYY-MM-DD).
 * @param {string} hasta - Fecha final (YYYY-MM-DD).
 * @throws {Object} 400 si faltan parámetros de fecha.
 */
const getByFecha = (desde, hasta) => {
  if (!desde || !hasta) throw { status: 400, message: 'desde y hasta son requeridos' };
  return repo.findByFecha(desde, hasta);
};

/**
 * Registra el ingreso de un vehículo y marca la celda como OCUPADA.
 * @swagger
 * /api/entradas-salidas/entrada:
 * post:
 * summary: Registrar entrada de vehículo
 * tags: [Control de Acceso]
 * responses:
 * 200:
 * description: Entrada registrada y celda actualizada a ocupada.
 * 409:
 * description: Conflicto - La celda ya está ocupada.
 */
const registrarEntrada = async ({ celda, vehiculo, descripcion }) => {
  if (!celda || !vehiculo) throw { status: 400, message: 'celda y vehiculo son requeridos' };

  const celdaExiste = await celdaRepo.findById(celda);
  if (!celdaExiste) throw { status: 404, message: 'Celda no encontrada' };
  
  // Regla de negocio: Validar disponibilidad
  if (!celdaExiste.estado) throw { status: 409, message: 'La celda no está disponible' };

  const vehExiste = await vehRepo.findById(vehiculo);
  if (!vehExiste) throw { status: 404, message: 'Vehículo no encontrado' };

  // Efecto secundario: Marcar celda como ocupada (estado = 0)
  await celdaRepo.update(celda, { discapacidad: celdaExiste.discapacidad, estado: 0 });

  return repo.create({ tipo: 'entrada', celda, vehiculo, descripcion });
};

/**
 * Registra la salida de un vehículo y LIBERA la celda.
 * @swagger
 * /api/entradas-salidas/salida:
 * post:
 * summary: Registrar salida de vehículo
 * tags: [Control de Acceso]
 * responses:
 * 200:
 * description: Salida registrada y celda liberada (estado 1).
 */
const registrarSalida = async ({ celda, vehiculo, descripcion }) => {
  if (!celda || !vehiculo) throw { status: 400, message: 'celda y vehiculo son requeridos' };

  const celdaExiste = await celdaRepo.findById(celda);
  if (!celdaExiste) throw { status: 404, message: 'Celda no encontrada' };

  // Efecto secundario: Liberar celda (estado = 1)
  await celdaRepo.update(celda, { discapacidad: celdaExiste.discapacidad, estado: 1 });

  return repo.create({ tipo: 'salida', celda, vehiculo, descripcion });
};

/**
 * Elimina un registro del historial.
 * @param {number} id 
 */
const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, getByVehiculo, getByFecha, registrarEntrada, registrarSalida, remove };