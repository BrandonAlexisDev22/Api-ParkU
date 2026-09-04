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
const PasswordUtil = require('../utils/password.util');

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
const validarReferencias = async ({ usuario_id, tipo_usuario_id }, conductorIdActual = null) => {
  if (usuario_id) {
    const usuario = await usuarioRepo.findById(usuario_id);
    if (!usuario) throw { status: 404, message: 'El usuario indicado no existe' };

    // conductor.usuario_id es UNIQUE: una cuenta pertenece como mucho a un conductor. Sin
    // esta comprobación el choque lo daba la base de datos como error de constraint, que
    // sube como 500 ilegible en vez de decir qué pasó y con quién.
    const yaVinculado = await repo.findByUsuarioId(usuario_id);
    if (yaVinculado && yaVinculado.id !== Number(conductorIdActual)) {
      throw {
        status: 409,
        message: `Esa cuenta ya está vinculada al conductor ${yaVinculado.nombre_apellidos}. Cancela primero esa vinculación (DELETE /api/conductores/${yaVinculado.id}/usuario).`,
        data: { conductor_id: yaVinculado.id, nombre_apellidos: yaVinculado.nombre_apellidos },
      };
    }
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
    tipo_documento = 'CC', numero_documento, nombre_apellidos,
    direccion, numero_telefonico, tipo_usuario_id, regional_formacion,
    centro_formacion, programa_formacion, vigencia,
    movilidad_reducida = false, tipo_discapacidad, estado = true, contrasena,
  } = data;
  // correo puede reasignarse: si se vincula una cuenta existente, manda el correo de esa
  // cuenta (ver más abajo).
  let { usuario_id, correo } = data;

  if (!numero_documento) throw { status: 400, message: 'El número de documento es requerido' };
  if (!nombre_apellidos) throw { status: 400, message: 'El nombre y apellidos son requeridos' };
  // tipo_usuario_id es OPCIONAL. El alta que ocurre en medio de asignar una celda (panel
  // de estacionamiento) no tiene por qué preguntar el perfil formativo del conductor
  // -- Aprendiz/Instructor/Administrativo no aporta nada a estacionar un vehículo, y
  // exigirlo obligaba al vigilante a inventar un valor. La columna ya era nullable y
  // crearConductorVinculado (registro público y alta admin de usuario) ya lo dejaba en
  // NULL, así que este era el único sitio que lo exigía. Si viene, se valida igual.
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

  // Solo se pasa tipo_usuario_id cuando de verdad vino: validarReferencias comprueba
  // `!== undefined`, así que un null explícito lo mandaría a buscar el catálogo con id
  // null y respondería un 404 confuso en vez de aceptarlo como "sin perfil asignado".
  const referencias = {};
  if (usuario_id) referencias.usuario_id = usuario_id;
  if (tipo_usuario_id) referencias.tipo_usuario_id = tipo_usuario_id;
  await validarReferencias(referencias);

  // Cuando se vincula una cuenta existente, SU correo manda: es el que sirve para iniciar
  // sesión y el que ya está verificado. Aceptar aquí uno distinto dejaría dos correos para
  // la misma persona (uno en `usuario`, otro en `conductor`) sin forma de saber cuál vale.
  if (usuario_id) {
    const cuenta = await usuarioRepo.findById(usuario_id);
    if (correo && correo.trim().toLowerCase() !== cuenta.correo.trim().toLowerCase()) {
      throw {
        status: 409,
        message: `El correo lo define la cuenta vinculada (${cuenta.correo}) y no se puede cambiar desde el conductor`,
        data: { correo_de_la_cuenta: cuenta.correo },
      };
    }
    correo = cuenta.correo;
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
          // Este camino crea una cuenta de usuario nueva, así que aplica la misma política
          // que POST /api/usuarios y el registro público: fortaleza + confirmación.
          PasswordUtil.validarNueva(contrasena, data);
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
 * Cancela la vinculación entre un conductor y su cuenta de usuario, SIN borrar ninguno de
 * los dos: el conductor queda como "registrado por vigilancia, sin cuenta propia"
 * (usuario_id NULL, que es un estado válido del modelo) y la cuenta de usuario sigue
 * existiendo intacta.
 *
 * Es la salida para el error más común del alta de conductores: elegir la cuenta
 * equivocada en el selector. Antes no había forma de deshacerlo -- usuario_id es UNIQUE,
 * así que esa cuenta quedaba atrapada en el conductor equivocado y no podía vincularse a
 * quien correspondía, y la única alternativa era borrar el conductor y volver a crearlo,
 * perdiendo sus vehículos y su historial.
 *
 * @param {number} id - ID del conductor.
 * @throws {Object} 404 si el conductor no existe; 409 si no tiene ninguna cuenta vinculada.
 * @returns {Promise<Object>} El conductor ya desvinculado.
 */
const desvincularUsuario = async (id) => {
  const conductor = await getById(id);

  if (!conductor.usuario_id) {
    throw { status: 409, message: 'Este conductor no tiene ninguna cuenta de usuario vinculada' };
  }

  try {
    return await repo.update(id, { usuario_id: null });
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

  // El correo de un conductor CON cuenta vinculada es de solo lectura: pertenece a la
  // cuenta (es la credencial de acceso y la dirección ya verificada). Editarlo aquí dejaba
  // al conductor y a su usuario con correos distintos, sin ninguna señal de cuál era el
  // bueno. Para cambiarlo se edita el usuario, o se cancela la vinculación primero.
  if (data.correo !== undefined && conductor.usuario_id && data.correo !== conductor.correo) {
    throw {
      status: 409,
      message: 'El correo no se puede editar desde el conductor porque proviene de su cuenta de usuario vinculada. Cámbialo en la cuenta (PUT /api/usuarios/:id) o cancela la vinculación primero.',
      data: { usuario_id: conductor.usuario_id, correo_actual: conductor.correo },
    };
  }

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

  // Se pasa el id actual para que vincular la cuenta que YA es suya no se rechace como
  // duplicada.
  await validarReferencias(data, id);

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
  desvincularUsuario,
  remove,
};
