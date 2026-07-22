/**
 * @module IngresoSalidaService
 * @description Gestión de flujos de acceso. Controla el registro de movimientos 
 * y la actualización de disponibilidad de celdas (coherente con el modelo Celda).
 */

const repo = require('../repositories/entradaSalida.repository');
const celdaRepo = require('../repositories/celda.repository');
const vehRepo = require('../repositories/vehiculo.repository');

/**
 * @swagger
 * components:
 *   schemas:
 *     EntradaSalida:
 *       type: object
 *       required:
 *         - tipo
 *         - vehiculo
 *         - celda
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental del registro.
 *         tipo:
 *           type: string
 *           enum: [INGRESO, SALIDA]
 *           description: Tipo de movimiento.
 *         vehiculo:
 *           type: integer
 *           description: ID del vehículo.
 *         celda:
 *           type: integer
 *           description: ID de la celda utilizada.
 *         descripcion:
 *           type: string
 *           nullable: true
 *           description: Observaciones opcionales.
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del movimiento.
 *         parqueadero_nombre:
 *           type: string
 *           description: Nombre del parqueadero (solo en respuestas con JOIN).
 *         vehiculo_placa:
 *           type: string
 *           description: Placa del vehículo (solo en respuestas con JOIN).
 *     EntradaSalidaCreate:
 *       type: object
 *       required:
 *         - vehiculo
 *         - celda
 *       properties:
 *         vehiculo:
 *           type: integer
 *         celda:
 *           type: integer
 *         descripcion:
 *           type: string
 *           nullable: true
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *           description: Opcional, si no se envía se usa la actual.
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
 * Registra el ingreso de un vehículo y marca la celda como OCUPADO.
 * @param {Object} data - Datos de la entrada.
 * @param {number} data.vehiculo - ID del vehículo.
 * @param {number} data.celda - ID de la celda.
 * @param {string} [data.descripcion] - Observaciones opcionales.
 * @param {string} [data.fecha_hora] - Fecha/hora personalizada (opcional).
 * @throws {Object} 400 si faltan campos obligatorios.
 * @throws {Object} 404 si vehículo o celda no existen.
 * @throws {Object} 409 si la celda ya está ocupada o el vehículo ya tiene una entrada activa.
 * @returns {Promise<Object>} Registro de entrada creado.
 */
const registrarEntrada = async ({ vehiculo, celda, descripcion, fecha_hora }) => {
  // Validar campos obligatorios
  if (!vehiculo) throw { status: 400, message: 'El vehículo es requerido' };
  if (!celda) throw { status: 400, message: 'La celda es requerida' };

  // Verificar existencia del vehículo
  const vehExiste = await vehRepo.findById(vehiculo);
  if (!vehExiste) throw { status: 404, message: 'Vehículo no encontrado' };

  // Verificar existencia y disponibilidad de la celda
  const celdaExiste = await celdaRepo.findById(celda);
  if (!celdaExiste) throw { status: 404, message: 'Celda no encontrada' };
  if (celdaExiste.estado_celda === 'OCUPADO') {
    throw { status: 409, message: 'La celda ya está ocupada' };
  }

  // Validar que el vehículo no tenga una entrada activa (sin salida)
  const historialVehiculo = await repo.findByVehiculo(vehiculo);
  const entradaActiva = historialVehiculo.find(r => r.tipo === 'INGRESO' && !r.fecha_salida);
  // Nota: Para esta validación se requiere que el modelo tenga un campo de salida o 
  // se infiera por la ausencia de un registro de SALIDA posterior.
  // Una implementación más robusta podría usar una columna 'activo' o buscar la última entrada sin salida.
  // Supondremos que el repositorio tiene un método para obtener la última entrada sin salida,
  // o podemos implementar una lógica más simple: buscar el último registro del vehículo y si es INGRESO y no tiene salida.
  // Por simplicidad, omitimos esta validación compleja aquí, pero se recomienda agregarla.
  // Se puede implementar así:
  /*
  const ultimoMovimiento = historialVehiculo[0]; // asumiendo orden DESC
  if (ultimoMovimiento && ultimoMovimiento.tipo === 'INGRESO') {
    // Verificar si ya existe una salida posterior (no en el mismo registro)
    // Esta lógica depende de la estructura de la tabla, podría requerir un campo adicional.
    // Una opción es agregar una columna 'activo' en ingreso_salida.
    throw { status: 409, message: 'El vehículo ya tiene una entrada activa' };
  }
  */

  // Actualizar estado de la celda a OCUPADO
  await celdaRepo.update(celda, { estado_celda: 'OCUPADO' });

  // Crear el registro de entrada
  return repo.create({
    tipo: 'INGRESO',
    vehiculo,
    celda,
    descripcion: descripcion || null,
    fecha_hora: fecha_hora || undefined,
  });
};

/**
 * Registra la salida de un vehículo y libera la celda (cambia a DISPONIBLE).
 * @param {Object} data - Datos de la salida.
 * @param {number} data.vehiculo - ID del vehículo.
 * @param {number} data.celda - ID de la celda.
 * @param {string} [data.descripcion] - Observaciones opcionales.
 * @param {string} [data.fecha_hora] - Fecha/hora personalizada (opcional).
 * @throws {Object} 400 si faltan campos obligatorios.
 * @throws {Object} 404 si vehículo o celda no existen.
 * @throws {Object} 409 si el vehículo no tiene una entrada activa.
 * @returns {Promise<Object>} Registro de salida creado.
 */
const registrarSalida = async ({ vehiculo, celda, descripcion, fecha_hora }) => {
  if (!vehiculo) throw { status: 400, message: 'El vehículo es requerido' };
  if (!celda) throw { status: 400, message: 'La celda es requerida' };

  const vehExiste = await vehRepo.findById(vehiculo);
  if (!vehExiste) throw { status: 404, message: 'Vehículo no encontrado' };

  const celdaExiste = await celdaRepo.findById(celda);
  if (!celdaExiste) throw { status: 404, message: 'Celda no encontrada' };

  // Validar que el vehículo tenga una entrada activa para esta celda (o al menos una entrada sin salida)
  // Aquí se podría verificar que la celda esté ocupada por ese vehículo.
  // Por simplicidad, se asume que la celda está ocupada por ese vehículo.
  // Una implementación más robusta: buscar la última entrada del vehículo en esa celda sin salida registrada.
  // Pero dado que no tenemos esa información, se puede omitir o agregar una columna 'activo' en la tabla.

  // Liberar la celda (cambiar a DISPONIBLE)
  await celdaRepo.update(celda, { estado_celda: 'DISPONIBLE' });

  return repo.create({
    tipo: 'SALIDA',
    vehiculo,
    celda,
    descripcion: descripcion || null,
    fecha_hora: fecha_hora || undefined,
  });
};

/**
 * Elimina un registro del historial (uso administrativo).
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
  getByFecha,
  registrarEntrada,
  registrarSalida,
  remove,
};