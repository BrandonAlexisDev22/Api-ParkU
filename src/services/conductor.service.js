/**
 * @module ConductorService
 * @description Lógica de negocio para la gestión de conductores.
 * Alineado con la tabla real 'conductor' (esquema Postgres/SENA):
 * usuario_id, tipo_documento, numero_documento, nombre_apellidos, correo,
 * direccion, numero_telefonico, tipo_usuario_id, regional_formacion,
 * centro_formacion, programa_formacion (texto libre, dato de SOFIA Plus),
 * vigencia, movilidad_reducida, tipo_discapacidad, estado.
 */

const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const repo = require('../repositories/conductor.repository');
const usuarioRepo = require('../repositories/usuario.repository');
const tipoUsuarioRepo = require('../repositories/tipoUsuario.repository');
const { traducirErrorTrigger } = require('../utils/dbContext.util');
const { ROLES } = require('../config/roles');

const TIPOS_DOCUMENTO = ['CC', 'CE', 'TI', 'PASAPORTE', 'PEP', 'NIT'];

const validarCorreo = (correo) => {
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    throw { status: 400, message: 'El correo electrónico no tiene un formato válido' };
  }
};

/**
 * La BD exige (CHECK chk_conductor_discapacidad) que tipo_discapacidad solo
 * venga poblado cuando movilidad_reducida = true.
 */
const validarDiscapacidad = (movilidadReducida, tipoDiscapacidad) => {
  if (tipoDiscapacidad && !movilidadReducida) {
    throw { status: 400, message: 'tipo_discapacidad solo puede registrarse si movilidad_reducida es true' };
  }
};

/**
 * Valida que las referencias a catálogos y usuario existan.
 * @param {Object} data
 */
const validarReferencias = async ({ usuario_id, tipo_usuario_id }) => {
  if (usuario_id) {
    const usuario = await usuarioRepo.findById(usuario_id);
    if (!usuario) throw { status: 404, message: 'El usuario indicado no existe' };
  }
  if (tipo_usuario_id !== undefined) {
    const tipoUsuario = await tipoUsuarioRepo.findById(tipo_usuario_id);
    if (!tipoUsuario) throw { status: 404, message: 'El tipo de usuario indicado no existe' };
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
 * Busca el conductor vinculado a una cuenta de usuario (1:1). Es lo único que permite a
 * un frontend recuperar el documento de "el usuario logueado" sin ya conocer su
 * conductor_id -- ver PUT /api/usuarios/foto para el mismo patrón de "usar el usuario
 * autenticado", y usuario.service.js para el bug que esto corrige (el documento se
 * perdía porque no había forma de leerlo de vuelta).
 * @param {number} usuarioId
 * @throws {Object} 404 si ese usuario no tiene un conductor vinculado.
 * @returns {Promise<Object>}
 */
const getByUsuarioId = async (usuarioId) => {
  const item = await repo.findByUsuarioId(usuarioId);
  if (!item) throw { status: 404, message: 'Este usuario no tiene un conductor vinculado' };
  return item;
};

/**
 * Crea un nuevo conductor. Si no se envía usuario_id:
 *   - Si `correo` corresponde a un Usuario ya existente, se reutiliza (se vincula a él).
 *   - Si no existe ningún Usuario con ese correo, se crea uno nuevo (requiere
 *     `contrasena`) dentro de la MISMA transacción que el conductor -- si la creación
 *     del conductor falla después (p. ej. documento duplicado), el rollback deshace
 *     también el usuario recién creado: nunca queda un usuario huérfano.
 * @param {Object} data
 * @param {string} [data.correo] - Para vincular/crear el usuario cuando no se envía usuario_id.
 * @param {string} [data.contrasena] - Requerida solo si hay que crear un usuario nuevo.
 * @throws {Object} 400 si faltan campos o son inválidos.
 * @throws {Object} 404 si alguna referencia (usuario/catálogo) no existe.
 * @throws {Object} 409 si el documento o correo ya están registrados.
 * @returns {Promise<Object>} Conductor creado.
 */
const create = async (data) => {
  const {
    tipo_documento = 'CC', numero_documento, nombre_apellidos, correo,
    direccion, numero_telefonico, tipo_usuario_id, regional_formacion,
    centro_formacion, programa_formacion, vigencia,
    movilidad_reducida = false, tipo_discapacidad, estado = true, contrasena,
  } = data;
  let { usuario_id } = data;

  if (!numero_documento) throw { status: 400, message: 'El número de documento es requerido' };
  if (!nombre_apellidos) throw { status: 400, message: 'El nombre y apellidos son requeridos' };
  if (!tipo_usuario_id) throw { status: 400, message: 'El tipo de usuario es requerido' };
  // El correo es la clave para resolver la cuenta de usuario (reutilizar la existente o
  // crear una nueva), y el teléfono es dato de contacto obligatorio del conductor.
  if (!correo) throw { status: 400, message: 'El correo es requerido' };
  if (!numero_telefonico) throw { status: 400, message: 'El número telefónico es requerido' };

  if (!TIPOS_DOCUMENTO.includes(tipo_documento)) {
    throw { status: 400, message: `Tipo de documento inválido. Permitidos: ${TIPOS_DOCUMENTO.join(', ')}` };
  }
  validarCorreo(correo);
  validarDiscapacidad(movilidad_reducida, tipo_discapacidad);

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

  if (usuario_id) {
    await validarReferencias({ usuario_id, tipo_usuario_id });
  } else {
    await validarReferencias({ tipo_usuario_id });
  }

  try {
    return await sequelize.transaction(async (transaction) => {
      if (!usuario_id && correo) {
        const usuarioExistente = await usuarioRepo.findByCorreo(correo);
        if (usuarioExistente) {
          usuario_id = usuarioExistente.id;
        } else {
          if (!contrasena) {
            throw { status: 400, message: 'contrasena es requerida para crear la cuenta de usuario de este conductor' };
          }
          const hash = await bcrypt.hash(contrasena, 10);
          const nuevoUsuario = await usuarioRepo.create(
            { nombre: nombre_apellidos, correo, contrasena: hash, rol_id: ROLES.CONDUCTOR, numero_telefonico },
            { transaction },
          );
          usuario_id = nuevoUsuario.id;
        }
      }

      return repo.create({
        usuario_id, tipo_documento, numero_documento, nombre_apellidos, correo,
        direccion, numero_telefonico, tipo_usuario_id, regional_formacion,
        centro_formacion, programa_formacion, vigencia,
        movilidad_reducida, tipo_discapacidad, estado,
      }, { transaction });
    });
  } catch (error) {
    traducirErrorTrigger(error);
  }
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

  const movilidadReducidaFinal = data.movilidad_reducida !== undefined ? data.movilidad_reducida : conductor.movilidad_reducida;
  const tipoDiscapacidadFinal = data.tipo_discapacidad !== undefined ? data.tipo_discapacidad : conductor.tipo_discapacidad;
  validarDiscapacidad(movilidadReducidaFinal, tipoDiscapacidadFinal);

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
 * @throws {Object} 404 si no existe; 409 si tiene vehículos, reservas o ingresos asociados.
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  await getById(id);
  try {
    return await repo.remove(id);
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

module.exports = {
  getAll,
  getById,
  getActivos,
  getByDocumento,
  getByCorreo,
  getByUsuarioId,
  create,
  update,
  remove,
};
