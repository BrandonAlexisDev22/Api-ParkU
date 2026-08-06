/**
 * @module ConductorService
 * @description Lógica de negocio para la gestión de conductores.
 * Alineado con la tabla real 'conductor' (esquema Postgres/SENA):
 * usuario_id, tipo_documento, numero_documento, nombre_apellidos, correo,
 * direccion, numero_telefonico, tipo_usuario_id, regional_formacion_id,
 * centro_formacion_id, programa_formacion_id, vigencia, estado.
 */

const repo = require('../repositories/conductor.repository');
const usuarioRepo = require('../repositories/usuario.repository');
const tipoUsuarioRepo = require('../repositories/tipoUsuario.repository');
const regionalFormacionRepo = require('../repositories/regionalFormacion.repository');
const centroFormacionRepo = require('../repositories/centroFormacion.repository');
const programaFormacionRepo = require('../repositories/programaFormacion.repository');

const TIPOS_DOCUMENTO = ['CC', 'CE', 'PAS', 'TI', 'NIT'];

const validarCorreo = (correo) => {
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    throw { status: 400, message: 'El correo electrónico no tiene un formato válido' };
  }
};

/**
 * Valida que las referencias a catálogos y usuario existan.
 * @param {Object} data
 */
const validarReferencias = async ({ usuario_id, tipo_usuario_id, regional_formacion_id, centro_formacion_id, programa_formacion_id }) => {
  if (usuario_id) {
    const usuario = await usuarioRepo.findById(usuario_id);
    if (!usuario) throw { status: 404, message: 'El usuario indicado no existe' };
  }
  if (tipo_usuario_id !== undefined) {
    const tipoUsuario = await tipoUsuarioRepo.findById(tipo_usuario_id);
    if (!tipoUsuario) throw { status: 404, message: 'El tipo de usuario indicado no existe' };
  }
  if (regional_formacion_id !== undefined) {
    const regional = await regionalFormacionRepo.findById(regional_formacion_id);
    if (!regional) throw { status: 404, message: 'La regional de formación indicada no existe' };
  }
  if (centro_formacion_id !== undefined) {
    const centro = await centroFormacionRepo.findById(centro_formacion_id);
    if (!centro) throw { status: 404, message: 'El centro de formación indicado no existe' };
  }
  if (programa_formacion_id !== undefined) {
    const programa = await programaFormacionRepo.findById(programa_formacion_id);
    if (!programa) throw { status: 404, message: 'El programa de formación indicado no existe' };
  }
};

/**
 * Obtiene la lista de todos los conductores.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca un conductor por su identificador.
 * @param {number} id
 * @throws {Object} 404 si el conductor no existe.
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Conductor no encontrado' };
  return item;
};

/**
 * Obtiene conductores activos (estado = true).
 * @returns {Promise<Array>}
 */
const getActivos = () => repo.findActivos();

/**
 * Busca un conductor por su documento (tipo + número).
 * @param {string} tipoDocumento
 * @param {string} numeroDocumento
 * @throws {Object} 404 si no existe.
 * @returns {Promise<Object>}
 */
const getByDocumento = async (tipoDocumento, numeroDocumento) => {
  const item = await repo.findByDocumento(tipoDocumento, numeroDocumento);
  if (!item) throw { status: 404, message: 'Conductor no encontrado' };
  return item;
};

/**
 * Busca conductores por correo electrónico.
 * @param {string} correo
 * @returns {Promise<Array>}
 */
const getByCorreo = (correo) => repo.findByCorreo(correo);

/**
 * Crea un nuevo conductor.
 * @param {Object} data
 * @throws {Object} 400 si faltan campos o son inválidos.
 * @throws {Object} 404 si alguna referencia (usuario/catálogo) no existe.
 * @throws {Object} 409 si el documento o correo ya están registrados.
 * @returns {Promise<Object>} Conductor creado.
 */
const create = async (data) => {
  const {
    usuario_id, tipo_documento = 'CC', numero_documento, nombre_apellidos, correo,
    direccion, numero_telefonico, tipo_usuario_id, regional_formacion_id,
    centro_formacion_id, programa_formacion_id, vigencia, estado = true,
  } = data;

  if (!numero_documento) throw { status: 400, message: 'El número de documento es requerido' };
  if (!nombre_apellidos) throw { status: 400, message: 'El nombre y apellidos son requeridos' };
  if (!direccion) throw { status: 400, message: 'La dirección es requerida' };
  if (!tipo_usuario_id) throw { status: 400, message: 'El tipo de usuario es requerido' };
  if (!regional_formacion_id) throw { status: 400, message: 'La regional de formación es requerida' };
  if (!centro_formacion_id) throw { status: 400, message: 'El centro de formación es requerido' };
  if (!programa_formacion_id) throw { status: 400, message: 'El programa de formación es requerido' };
  if (!vigencia) throw { status: 400, message: 'La vigencia es requerida' };

  if (!TIPOS_DOCUMENTO.includes(tipo_documento)) {
    throw { status: 400, message: `Tipo de documento inválido. Permitidos: ${TIPOS_DOCUMENTO.join(', ')}` };
  }
  validarCorreo(correo);

  const existeDoc = await repo.findByDocumento(tipo_documento, numero_documento);
  if (existeDoc) {
    throw { status: 409, message: 'Ya existe un conductor con ese tipo y número de documento' };
  }

  if (correo) {
    const existeCorreo = await repo.findByCorreo(correo);
    if (existeCorreo.length > 0) {
      throw { status: 409, message: 'Ya existe un conductor con ese correo electrónico' };
    }
  }

  await validarReferencias({ usuario_id, tipo_usuario_id, regional_formacion_id, centro_formacion_id, programa_formacion_id });

  return repo.create({
    usuario_id, tipo_documento, numero_documento, nombre_apellidos, correo,
    direccion, numero_telefonico, tipo_usuario_id, regional_formacion_id,
    centro_formacion_id, programa_formacion_id, vigencia, estado,
  });
};

/**
 * Actualiza parcialmente un conductor existente.
 * @param {number} id
 * @param {Object} data - Campos a actualizar (todos opcionales).
 * @throws {Object} 404 si el conductor o alguna referencia no existe.
 * @throws {Object} 400 si algún valor es inválido.
 * @throws {Object} 409 si el nuevo documento o correo ya están en uso.
 * @returns {Promise<Object>} Conductor actualizado.
 */
const update = async (id, data) => {
  const conductor = await getById(id);

  if (data.tipo_documento && !TIPOS_DOCUMENTO.includes(data.tipo_documento)) {
    throw { status: 400, message: `Tipo de documento inválido. Permitidos: ${TIPOS_DOCUMENTO.join(', ')}` };
  }
  if (data.correo !== undefined) validarCorreo(data.correo);

  const tipoDocumentoFinal = data.tipo_documento !== undefined ? data.tipo_documento : conductor.tipo_documento;
  const numeroDocumentoFinal = data.numero_documento !== undefined ? data.numero_documento : conductor.numero_documento;
  if (data.tipo_documento !== undefined || data.numero_documento !== undefined) {
    const existeDoc = await repo.findByDocumento(tipoDocumentoFinal, numeroDocumentoFinal);
    if (existeDoc && existeDoc.id !== id) {
      throw { status: 409, message: 'Ya existe otro conductor con ese tipo y número de documento' };
    }
  }

  if (data.correo && data.correo !== conductor.correo) {
    const existeCorreo = await repo.findByCorreo(data.correo);
    if (existeCorreo.some((c) => c.id !== id)) {
      throw { status: 409, message: 'Ya existe otro conductor con ese correo electrónico' };
    }
  }

  await validarReferencias(data);

  return repo.update(id, data);
};

/**
 * Elimina un conductor (borrado físico).
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
  getActivos,
  getByDocumento,
  getByCorreo,
  create,
  update,
  remove,
};
