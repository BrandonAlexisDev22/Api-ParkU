/**
 * @module VehiculoService
 * @description Lógica de negocio para la gestión de vehículos (Proceso 04.2).
 * Alineado con el modelo Vehiculo real: la propiedad no es una FK directa, vive en
 * detalle_propiedad (M:N con conductor); el repo acepta un conductor_id opcional en
 * create() para registrar al propietario principal. placa es única y nula solo para
 * bicicletas (ck_vehiculo_placa_por_tipo) -- la BD la normaliza y valida el formato.
 *
 * vehiculo lleva trigger de auditoría (requiere SET LOCAL app.usuario_id), por eso
 * create/update/remove van envueltos en runWithUsuario.
 */

const repo = require('../repositories/vehiculo.repository');
const conductorRepo = require('../repositories/conductor.repository');
const { runWithUsuario, traducirErrorTrigger } = require('../utils/dbContext.util');

const TIPOS_PERMITIDOS = ['CARRO', 'MOTO', 'BICICLETA', 'CAMION', 'BUS'];
// Placas colombianas: 5-6 caracteres alfanuméricos tras normalizar (mayúsculas, sin
// espacios/guiones) -- mismo criterio que ck_vehiculo_placa_formato en la BD, más estricto
// en longitud para que el frontend y el backend rechacen el mismo formato.
const PLACA_REGEX = /^[A-Z0-9]{5,6}$/;

/**
 * Normaliza y valida el formato de la placa.
 * @private
 * @throws {Object} 400 si el formato no es válido.
 * @returns {string} Placa normalizada (mayúsculas, sin espacios/guiones).
 */
const _validarPlaca = (placa) => {
  const normalizada = placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!PLACA_REGEX.test(normalizada)) {
    throw { status: 400, message: 'Formato de placa inválido (debe tener 5 o 6 caracteres alfanuméricos)' };
  }
  return normalizada;
};

/**
 * Valida que, si vienen en el payload, marca y color no lleguen vacíos.
 * @private
 * @throws {Object} 400 si marca o color vienen como cadena vacía.
 */
const _validarMarcaColor = (data) => {
  if (data.marca !== undefined && !String(data.marca).trim()) {
    throw { status: 400, message: 'La marca no puede estar vacía' };
  }
  if (data.color !== undefined && !String(data.color).trim()) {
    throw { status: 400, message: 'El color no puede estar vacío' };
  }
};

/**
 * Obtiene la lista global de vehículos.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca un vehículo por su ID.
 * @param {number} id
 * @throws {Object} 404 si el vehículo no existe.
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Vehículo no encontrado' };
  return item;
};

/**
 * Obtiene todos los vehículos asociados a un conductor.
 * @param {number} conductorId
 * @returns {Promise<Array>}
 */
const getByConductor = (conductorId) => repo.findByConductor(conductorId);

/**
 * Registra un nuevo vehículo. La placa es obligatoria salvo para bicicletas.
 * @param {Object} data - Datos del vehículo; conductor_id opcional (propietario principal).
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 400 si faltan datos, 404 si el conductor no existe, 409 si la placa ya está registrada.
 * @returns {Promise<Object>}
 */
const create = async (data, usuarioId) => {
  const { conductor_id, tipo } = data;
  let { placa } = data;

  if (!tipo) throw { status: 400, message: 'El tipo de vehículo es requerido' };
  if (!TIPOS_PERMITIDOS.includes(tipo)) {
    throw { status: 400, message: `Tipo inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }
  if (!placa && tipo !== 'BICICLETA') {
    throw { status: 400, message: 'La placa es requerida (solo las bicicletas pueden omitirla)' };
  }
  _validarMarcaColor(data);

  if (conductor_id) {
    const conductorExiste = await conductorRepo.findById(conductor_id);
    if (!conductorExiste) throw { status: 404, message: 'Conductor no encontrado' };
  }

  if (placa) {
    placa = _validarPlaca(placa);
    data = { ...data, placa };
    const placaExiste = await repo.findByPlaca(placa);
    if (placaExiste) {
      // El frontend necesita saber a quién pertenece ya el vehículo, no solo que existe.
      throw {
        status: 409,
        message: 'La placa ya está registrada',
        data: {
          vehiculo_id: placaExiste.id,
          placa: placaExiste.placa,
          tipo: placaExiste.tipo,
          conductor_principal_id: placaExiste.conductor_principal_id,
          conductor_principal_nombre: placaExiste.conductor_principal_nombre,
        },
      };
    }
  }

  try {
    return await runWithUsuario(usuarioId, (transaction) => repo.create(data, { transaction }));
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

/**
 * Actualiza un vehículo validando placa duplicada (si se cambia).
 * @param {number} id
 * @param {Object} data - Campos a actualizar (atributos propios del vehículo).
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 404 si no existe, 400 si datos inválidos, 409 si placa duplicada.
 * @returns {Promise<Object>}
 */
const update = async (id, data, usuarioId) => {
  const vehiculo = await getById(id);

  if (data.tipo && !TIPOS_PERMITIDOS.includes(data.tipo)) {
    throw { status: 400, message: `Tipo inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }
  _validarMarcaColor(data);

  if (data.placa) {
    data = { ...data, placa: _validarPlaca(data.placa) };
  }

  if (data.placa && data.placa !== vehiculo.placa) {
    const dup = await repo.findByPlaca(data.placa);
    if (dup && dup.id !== Number(id)) {
      throw {
        status: 409,
        message: 'La placa ya está registrada',
        data: {
          vehiculo_id: dup.id,
          placa: dup.placa,
          tipo: dup.tipo,
          conductor_principal_id: dup.conductor_principal_id,
          conductor_principal_nombre: dup.conductor_principal_nombre,
        },
      };
    }
  }

  try {
    return await runWithUsuario(usuarioId, (transaction) => repo.update(id, data, { transaction }));
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

/**
 * Elimina un vehículo del sistema.
 * @param {number} id
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 404 si no existe, 409 si está en uso en reservas o movimientos.
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

/**
 * Vincula un conductor adicional como copropietario de un vehículo -- un mismo vehículo
 * puede tener más de un dueño (p. ej. una pareja o una familia compartiendo un carro), sin
 * reemplazar al propietario principal que ya tiene fijado desde `create`.
 * @param {number} vehiculoId
 * @param {number} conductorId
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 404 si el vehículo o el conductor no existen, 409 si ya es propietario.
 * @returns {Promise<Object>}
 */
const agregarPropietario = async (vehiculoId, conductorId, usuarioId) => {
  await getById(vehiculoId);
  const conductorExiste = await conductorRepo.findById(conductorId);
  if (!conductorExiste) throw { status: 404, message: 'Conductor no encontrado' };

  const yaEsPropietario = await repo.findPropietario(vehiculoId, conductorId);
  if (yaEsPropietario) throw { status: 409, message: 'Este conductor ya es propietario de este vehículo' };

  try {
    return await runWithUsuario(usuarioId, (transaction) => repo.agregarPropietario(vehiculoId, conductorId, { transaction }));
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

/**
 * Desvincula a un conductor como propietario de un vehículo. No se puede quitar al
 * propietario principal por esta vía (reasignar el principal no está soportado) ni dejar el
 * vehículo sin ningún propietario.
 * @param {number} vehiculoId
 * @param {number} conductorId
 * @param {number} usuarioId - Usuario autenticado que hace la operación (auditoría).
 * @throws {Object} 404 si el vínculo no existe, 409 si es el principal o el único propietario.
 * @returns {Promise<Object>}
 */
const quitarPropietario = async (vehiculoId, conductorId, usuarioId) => {
  const vehiculo = await getById(vehiculoId);
  const propietario = await repo.findPropietario(vehiculoId, conductorId);
  if (!propietario) throw { status: 404, message: 'Este conductor no es propietario de este vehículo' };
  if (propietario.es_principal) {
    throw { status: 409, message: 'No se puede quitar al propietario principal; asigna otro principal antes de intentarlo' };
  }
  if (vehiculo.conductores.length <= 1) {
    throw { status: 409, message: 'El vehículo debe tener al menos un propietario' };
  }

  try {
    return await runWithUsuario(usuarioId, (transaction) => repo.quitarPropietario(vehiculoId, conductorId, { transaction }));
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

module.exports = { getAll, getById, getByConductor, create, update, remove, agregarPropietario, quitarPropietario };
