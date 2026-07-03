/**
 * @module ConductorService
 * @description Lógica de negocio para la gestión de perfiles de conductores.
 * Alineado con el modelo Conductor (nombre, tipo_documento, documento, licencia, correo, numero, perfil, estado).
 */

const repo = require('../repositories/conductor.repository');

// Constantes para validación de tipos de documento
const TIPOS_DOCUMENTO = ['CC', 'CE', 'PAS', 'TI', 'NIT'];

/**
 * @swagger
 * components:
 *   schemas:
 *     Conductor:
 *       type: object
 *       required:
 *         - nombre
 *         - tipo_documento
 *         - documento
 *         - perfil
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental del conductor.
 *         nombre:
 *           type: string
 *           description: Nombre completo del conductor.
 *         tipo_documento:
 *           type: string
 *           enum: [CC, CE, PAS, TI, NIT]
 *           description: Tipo de documento de identidad.
 *         documento:
 *           type: integer
 *           description: Número de documento (único).
 *         licencia:
 *           type: string
 *           nullable: true
 *           description: Número de licencia de conducción.
 *         correo:
 *           type: string
 *           format: email
 *           nullable: true
 *           description: Correo electrónico.
 *         numero:
 *           type: string
 *           nullable: true
 *           description: Número telefónico.
 *         perfil:
 *           type: integer
 *           description: ID del perfil institucional (referencia a tabla perfil).
 *         estado:
 *           type: boolean
 *           default: true
 *           description: Estado del conductor (activo/inactivo).
 *         perfil_nombre:
 *           type: string
 *           description: Nombre del perfil (solo en respuestas con JOIN).
 *     ConductorCreate:
 *       type: object
 *       required:
 *         - nombre
 *         - tipo_documento
 *         - documento
 *         - perfil
 *       properties:
 *         nombre:
 *           type: string
 *         tipo_documento:
 *           type: string
 *           enum: [CC, CE, PAS, TI, NIT]
 *         documento:
 *           type: integer
 *         licencia:
 *           type: string
 *           nullable: true
 *         correo:
 *           type: string
 *           format: email
 *           nullable: true
 *         numero:
 *           type: string
 *           nullable: true
 *         perfil:
 *           type: integer
 *         estado:
 *           type: boolean
 *           default: true
 *     ConductorUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *         tipo_documento:
 *           type: string
 *           enum: [CC, CE, PAS, TI, NIT]
 *         documento:
 *           type: integer
 *         licencia:
 *           type: string
 *           nullable: true
 *         correo:
 *           type: string
 *           format: email
 *           nullable: true
 *         numero:
 *           type: string
 *           nullable: true
 *         perfil:
 *           type: integer
 *         estado:
 *           type: boolean
 */

/**
 * Obtiene la lista de todos los conductores.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca un conductor por su identificador.
 * @param {number} id - ID del conductor.
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
 * Busca un conductor por su número de documento.
 * @param {number} documento
 * @throws {Object} 404 si no existe.
 * @returns {Promise<Object>}
 */
const getByDocumento = async (documento) => {
  const item = await repo.findByDocumento(documento);
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
 * Crea un nuevo registro de conductor.
 * @param {Object} data - Datos del conductor (todos los campos del modelo excepto id).
 * @param {string} data.nombre
 * @param {string} data.tipo_documento
 * @param {number} data.documento
 * @param {string|null} data.licencia
 * @param {string|null} data.correo
 * @param {string|null} data.numero
 * @param {number} data.perfil
 * @param {boolean} [data.estado=true]
 * @throws {Object} 400 si faltan campos o son inválidos.
 * @throws {Object} 409 si el documento o correo ya están registrados.
 * @returns {Promise<Object>} Conductor creado.
 */
const create = async ({ nombre, tipo_documento, documento, licencia, correo, numero, perfil, estado = true }) => {
  // Validar campos obligatorios
  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };
  if (!tipo_documento) throw { status: 400, message: 'El tipo de documento es requerido' };
  if (!documento) throw { status: 400, message: 'El número de documento es requerido' };
  if (!perfil) throw { status: 400, message: 'El perfil es requerido' };

  // Validar tipo de documento
  if (!TIPOS_DOCUMENTO.includes(tipo_documento)) {
    throw { status: 400, message: `Tipo de documento inválido. Permitidos: ${TIPOS_DOCUMENTO.join(', ')}` };
  }

  // Validar formato de correo (si se proporciona)
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    throw { status: 400, message: 'El correo electrónico no tiene un formato válido' };
  }

  // Verificar unicidad de documento
  const existeDoc = await repo.findByDocumento(documento);
  if (existeDoc) {
    throw { status: 409, message: 'Ya existe un conductor con ese número de documento' };
  }

  // Verificar unicidad de correo (si se proporciona)
  if (correo) {
    const existeCorreo = await repo.findByCorreo(correo);
    if (existeCorreo && existeCorreo.length > 0) {
      throw { status: 409, message: 'Ya existe un conductor con ese correo electrónico' };
    }
  }

  // Crear el conductor
  return repo.create({ nombre, tipo_documento, documento, licencia, correo, numero, perfil, estado });
};

/**
 * Actualiza parcialmente un conductor existente.
 * @param {number} id - ID del conductor.
 * @param {Object} data - Campos a actualizar (todos opcionales).
 * @throws {Object} 404 si el conductor no existe.
 * @throws {Object} 400 si algún valor es inválido.
 * @throws {Object} 409 si el nuevo documento o correo ya están en uso.
 * @returns {Promise<Object>} Conductor actualizado.
 */
const update = async (id, data) => {
  // Verificar que el conductor existe
  const conductor = await getById(id);

  // Validar tipo de documento si se envía
  if (data.tipo_documento && !TIPOS_DOCUMENTO.includes(data.tipo_documento)) {
    throw { status: 400, message: `Tipo de documento inválido. Permitidos: ${TIPOS_DOCUMENTO.join(', ')}` };
  }

  // Validar formato de correo si se envía
  if (data.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo)) {
    throw { status: 400, message: 'El correo electrónico no tiene un formato válido' };
  }

  // Si se actualiza el documento, verificar que no esté en uso por otro conductor
  if (data.documento && data.documento !== conductor.documento) {
    const existeDoc = await repo.findByDocumento(data.documento);
    if (existeDoc && existeDoc.id !== id) {
      throw { status: 409, message: 'Ya existe otro conductor con ese número de documento' };
    }
  }

  // Si se actualiza el correo, verificar que no esté en uso por otro conductor
  if (data.correo && data.correo !== conductor.correo) {
    const existeCorreo = await repo.findByCorreo(data.correo);
    if (existeCorreo && existeCorreo.length > 0 && existeCorreo.some(c => c.id !== id)) {
      throw { status: 409, message: 'Ya existe otro conductor con ese correo electrónico' };
    }
  }

  return repo.update(id, data);
};

/**
 * Elimina un perfil de conductor (borrado físico).
 * @param {number} id - ID del conductor.
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