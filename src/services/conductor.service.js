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
const { CAMPOS_DE_LA_CUENTA } = repo;
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
 * Resuelve los campos que pertenecen a la cuenta vinculada: los toma de ella y rechaza
 * cualquier valor distinto que venga en la petición.
 * @private
 * @param {Object} cuenta - Usuario ya cargado.
 * @param {Object} enviados - Valores que trae la petición para esos campos.
 * @throws {Object} 409 si algún valor enviado contradice al de la cuenta.
 * @returns {Object} Los valores definitivos.
 */
const _tomarDatosDeLaCuenta = (cuenta, enviados) => {
  const resultado = {};
  const normaliza = (v) => (v === undefined || v === null ? null : String(v).trim().toLowerCase());

  for (const campo of CAMPOS_DE_LA_CUENTA) {
    const deLaCuenta = cuenta[campo] ?? null;
    const enviado = enviados[campo] ?? null;

    if (enviado && deLaCuenta && normaliza(enviado) !== normaliza(deLaCuenta)) {
      throw {
        status: 409,
        message: `El campo "${campo}" lo define la cuenta vinculada (${deLaCuenta}) y no se puede cambiar desde el conductor`,
        data: { campo, valor_de_la_cuenta: deLaCuenta, campos_solo_lectura: CAMPOS_DE_LA_CUENTA },
      };
    }
    // La cuenta manda; si ella no lo tiene, vale lo enviado.
    resultado[campo] = deLaCuenta ?? enviado;
  }
  return resultado;
};

/**
 * Copia el documento del conductor a su cuenta de usuario, si tiene una.
 *
 * Las dos tablas guardan el documento a propósito (ver migración 002): `conductor` porque
 * puede existir sin cuenta, y `usuario` porque una cuenta necesita tenerlo aunque todavía
 * no sea conductor. Esta función es la que impide que las dos copias se separen; se llama
 * SIEMPRE dentro de la transacción que escribe el conductor.
 *
 * @private
 * @param {number|null} usuarioId
 * @param {string} tipoDocumento
 * @param {string} numeroDocumento
 * @param {import('sequelize').Transaction} transaction
 * @throws {Object} 409 si ese documento ya pertenece a otra cuenta.
 */
const _propagarDocumentoALaCuenta = async (usuarioId, tipoDocumento, numeroDocumento, transaction) => {
  if (!usuarioId || !tipoDocumento || !numeroDocumento) return;

  // Hay un índice único parcial (usuario_documento_idx): sin esta comprobación previa, el
  // choque llegaría como error crudo de Postgres en vez de un 409 explicando con quién.
  const otraCuenta = await usuarioRepo.findByDocumento(tipoDocumento, numeroDocumento, { transaction });
  if (otraCuenta && otraCuenta.id !== Number(usuarioId)) {
    throw {
      status: 409,
      message: `El documento ${tipoDocumento} ${numeroDocumento} ya está registrado en la cuenta ${otraCuenta.correo}`,
      data: { usuario_id: otraCuenta.id, correo: otraCuenta.correo },
    };
  }

  await usuarioRepo.update(
    usuarioId,
    { tipo_documento: tipoDocumento, numero_documento: numeroDocumento },
    { transaction },
  );
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
 * Decide qué hacer con la cuenta de acceso del conductor que se está creando. El
 * formulario elige el modo de forma explícita, en vez de deducirlo del correo:
 *
 *   VINCULAR   llega `usuario_id`      -> se usa esa cuenta, que ya existe.
 *   CREAR      llega `crear_cuenta:true` -> se crea la cuenta con correo + contraseña.
 *              Es el "no tiene cuenta" del formulario, el que despliega los campos de
 *              contraseña y confirmación.
 *   SIN_CUENTA llega `sin_cuenta:true`  -> el conductor queda sin cuenta de acceso
 *              (usuario_id NULL, un estado válido del modelo). Es el visitante que
 *              registra el vigilante al parquear: no hay a quién pedirle una contraseña.
 *   AUTO       no llega ninguna bandera pero sí correo -> comportamiento histórico, que se
 *              conserva para no romper a quien ya llamaba así: el correo decide (se
 *              reutiliza la cuenta que lo tenga, o se crea una si viene contraseña).
 *
 * @private
 * @throws {Object} 400 si se piden dos modos a la vez o no hay datos para decidir.
 * @returns {'VINCULAR'|'CREAR'|'SIN_CUENTA'|'AUTO'}
 */
const _resolverModoCuenta = ({ usuario_id, crear_cuenta, crearCuenta, sin_cuenta, correo }) => {
  const quiereCrear = crear_cuenta === true || crearCuenta === true;
  const quiereSinCuenta = sin_cuenta === true;

  if (quiereCrear && quiereSinCuenta) {
    throw { status: 400, message: 'crear_cuenta y sin_cuenta son opciones opuestas: envía solo una' };
  }
  if (usuario_id && quiereCrear) {
    throw {
      status: 400,
      message: 'No se puede crear una cuenta nueva y vincular una existente a la vez: envía usuario_id (vincular) o crear_cuenta (crear), no ambos',
    };
  }
  if (usuario_id && quiereSinCuenta) {
    throw { status: 400, message: 'sin_cuenta pide un conductor sin cuenta de acceso, así que no puede venir con usuario_id' };
  }

  if (usuario_id) return 'VINCULAR';
  if (quiereCrear) return 'CREAR';
  if (quiereSinCuenta) return 'SIN_CUENTA';
  if (correo) return 'AUTO';

  throw {
    status: 400,
    message: 'El correo es requerido. Si esta persona no va a tener cuenta de acceso envía sin_cuenta: true; si quieres crearle una, envía crear_cuenta: true con contrasena y confirmar_contrasena',
  };
};

/**
 * Crea un nuevo conductor, resolviendo su cuenta de acceso según el modo elegido
 * (ver _resolverModoCuenta): vincular una existente, crear una nueva, o ninguna.
 *
 * La cuenta y el conductor se escriben en la MISMA transacción: si la creación del
 * conductor falla después (p. ej. documento duplicado), el rollback deshace también el
 * usuario recién creado y nunca queda una cuenta huérfana.
 *
 * @param {Object} data
 * @param {number} [data.usuario_id] - Cuenta ya existente a la que vincularlo.
 * @param {boolean} [data.crear_cuenta] - Crear la cuenta de acceso (requiere correo,
 *   contrasena y confirmar_contrasena).
 * @param {boolean} [data.sin_cuenta] - Registrarlo sin cuenta de acceso.
 * @param {string} [data.correo]
 * @param {string} [data.contrasena]
 * @param {string} [data.confirmar_contrasena]
 * @throws {Object} 400 si faltan campos o son inválidos.
 * @throws {Object} 404 si alguna referencia (usuario/catálogo) no existe.
 * @throws {Object} 409 si el documento o correo ya están registrados.
 * @returns {Promise<Object>} Conductor creado.
 */
const create = async (data) => {
  const {
    tipo_documento = 'CC', numero_documento, nombre_apellidos,
    direccion, tipo_usuario_id, regional_formacion,
    centro_formacion, programa_formacion, vigencia,
    movilidad_reducida = false, tipo_discapacidad, estado = true, contrasena,
  } = data;
  // correo puede reasignarse: si se vincula una cuenta existente, manda el correo de esa
  // cuenta (ver más abajo).
  let { usuario_id, correo, numero_telefonico } = data;

  // Se decide ANTES de validar nada más: de él depende qué campos son obligatorios.
  const modoCuenta = _resolverModoCuenta(data);

  if (!numero_documento) throw { status: 400, message: 'El número de documento es requerido' };
  if (!nombre_apellidos) throw { status: 400, message: 'El nombre y apellidos son requeridos' };
  // tipo_usuario_id es OPCIONAL. El alta que ocurre en medio de asignar una celda (panel
  // de estacionamiento) no tiene por qué preguntar el perfil formativo del conductor
  // -- Aprendiz/Instructor/Administrativo no aporta nada a estacionar un vehículo, y
  // exigirlo obligaba al vigilante a inventar un valor. La columna ya era nullable y
  // crearConductorVinculado (registro público y alta admin de usuario) ya lo dejaba en
  // NULL, así que este era el único sitio que lo exigía. Si viene, se valida igual.
  // Correo y teléfono son obligatorios SALVO que se vincule una cuenta existente: en ese
  // caso salen de ella (ver CAMPOS_DE_LA_CUENTA más abajo) y exigirlos aquí obligaría al
  // formulario a reescribir a mano unos datos que precisamente no puede editar.
  if (modoCuenta === 'CREAR') {
    // Los tres campos del "no tiene cuenta": sin ellos no hay cuenta que crear.
    if (!correo) throw { status: 400, message: 'El correo es requerido para crear la cuenta de acceso' };
    if (!numero_telefonico) throw { status: 400, message: 'El número telefónico es requerido' };
    // Fortaleza + confirmación ANTES de tocar la base de datos, la misma política que
    // POST /api/usuarios y el registro público (PasswordUtil, un solo sitio).
    PasswordUtil.validarNueva(contrasena, data);
  } else if (modoCuenta === 'AUTO') {
    if (!numero_telefonico) throw { status: 400, message: 'El número telefónico es requerido' };
  }
  // SIN_CUENTA no exige correo ni teléfono: de un visitante al que se le registra el
  // vehículo para parquearlo puede no conocerse ninguno de los dos.

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

  // Cuando se vincula una cuenta existente, SUS datos de contacto mandan (ver
  // CAMPOS_DE_LA_CUENTA). Si no se envían, se toman de ella: el formulario no tiene que
  // reescribirlos a mano. Si se envían distintos, se rechaza, porque aceptarlos dejaría a
  // la misma persona con dos correos o dos teléfonos sin forma de saber cuál vale.
  if (usuario_id) {
    const cuenta = await usuarioRepo.findById(usuario_id);
    const deCuenta = _tomarDatosDeLaCuenta(cuenta, { correo, numero_telefonico });
    correo = deCuenta.correo;
    numero_telefonico = deCuenta.numero_telefonico;
  }

  try {
    return await sequelize.transaction(async (transaction) => {
      if (modoCuenta === 'CREAR') {
        // Pidieron crear la cuenta, así que ese correo tiene que estar libre. Antes se
        // reutilizaba en silencio la cuenta que lo tuviera, y el conductor acababa
        // vinculado a una persona distinta sin que nadie lo dijera.
        const cuentaExistente = await usuarioRepo.findByCorreo(correo);
        if (cuentaExistente) {
          throw {
            status: 409,
            message: `Ya existe una cuenta con el correo ${correo}: selecciónala en el buscador de cuentas en vez de crear una nueva`,
            data: { usuario_id: cuentaExistente.id, nombre: cuentaExistente.nombre },
          };
        }
        const telefonoEnUso = await usuarioRepo.findByTelefono(numero_telefonico);
        if (telefonoEnUso) {
          throw { status: 409, message: 'Este número de teléfono ya está registrado en otra cuenta' };
        }
        const hash = await bcrypt.hash(contrasena, 10);
        const nuevoUsuario = await usuarioRepo.create(
          { nombre: nombre_apellidos, correo, contrasena: hash, rol_id: ROLES.CONDUCTOR, numero_telefonico },
          { transaction },
        );
        usuario_id = nuevoUsuario.id;
      } else if (modoCuenta === 'AUTO' && correo) {
        const usuarioExistente = await usuarioRepo.findByCorreo(correo);
        if (usuarioExistente) {
          usuario_id = usuarioExistente.id;
          // Esa cuenta puede pertenecer ya a otro conductor (usuario_id es UNIQUE): sin
          // esta comprobación el choque llegaba como error crudo de Postgres.
          await validarReferencias({ usuario_id });
        } else {
          if (!contrasena) {
            throw {
              status: 400,
              message: 'contrasena es requerida para crear la cuenta de usuario de este conductor. Si esta persona no va a tener cuenta, envía sin_cuenta: true',
            };
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

      // El documento también es dato de la cuenta (migración 002): se propaga para que
      // ambas copias nazcan iguales y la cuenta pueda precargarlo más adelante.
      await _propagarDocumentoALaCuenta(usuario_id, tipo_documento, numero_documento, transaction);

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
 * Devuelve el conductor indicado y lo CREA si todavía no existe.
 *
 * Es lo que permite registrar un vehículo -- y por tanto parquearlo -- cuando su dueño
 * nunca ha pasado por el sistema. Antes el panel de estacionamiento se quedaba bloqueado
 * ahí: el vehículo exige propietario, así que había que abandonar el flujo, ir al módulo de
 * conductores, darlo de alta y volver a empezar con el vehículo delante de la barrera.
 *
 * El conductor que nace por este camino queda SIN cuenta de acceso (usuario_id NULL, un
 * estado válido del modelo): el vigilante no puede inventar una contraseña por el dueño del
 * vehículo. Esa persona puede registrarse después, y su cuenta se vincula entonces
 * (PUT /api/conductores/:id).
 *
 * @param {Object} datos
 * @param {number} [datos.conductor_id] - Si viene, solo se comprueba que exista.
 * @param {string} [datos.tipo_documento='CC'] - Alias: tipoDocumento.
 * @param {string} [datos.numero_documento] - Con él se busca antes de crear nada: si esa
 *   persona ya estaba registrada se reutiliza, no se duplica.
 * @param {string} [datos.nombre_apellidos] - Obligatorio solo si hay que crearlo.
 * @param {string} [datos.correo]
 * @param {string} [datos.numero_telefonico]
 * @param {Object} [opciones]
 * @param {import('sequelize').Transaction} [opciones.transaction] - La misma del vehículo,
 *   para que un fallo al crearlo no deje un conductor suelto.
 * @throws {Object} 400 si el documento es inválido o falta el nombre para crearlo.
 * @throws {Object} 404 si el conductor_id indicado no existe.
 * @returns {Promise<Object|null>} El conductor existente o el recién creado; null si no se
 *   pidió ninguno (el vehículo se registra sin propietario, como hasta ahora).
 */
const resolverOCrear = async (datos = {}, { transaction } = {}) => {
  if (datos.conductor_id) {
    const existente = await repo.findById(datos.conductor_id, { transaction });
    if (!existente) throw { status: 404, message: 'Conductor no encontrado' };
    return existente;
  }

  const numeroDocumento = datos.numero_documento ?? datos.numeroDocumento;
  if (!numeroDocumento) return null;

  const tipoDocumento = (datos.tipo_documento ?? datos.tipoDocumento ?? 'CC').toString().trim().toUpperCase();
  if (!TIPOS_DOCUMENTO.includes(tipoDocumento)) {
    throw { status: 400, message: `Tipo de documento inválido. Permitidos: ${TIPOS_DOCUMENTO.join(', ')}` };
  }

  const yaRegistrado = await repo.findByDocumento(tipoDocumento, numeroDocumento, { transaction });
  if (yaRegistrado) return yaRegistrado;

  if (!datos.nombre_apellidos) {
    throw {
      status: 400,
      message: `No hay ningún conductor con documento ${tipoDocumento} ${numeroDocumento}: envía nombre_apellidos para registrarlo en el momento`,
    };
  }
  validarCorreo(datos.correo);

  return repo.create({
    usuario_id: null,
    tipo_documento: tipoDocumento,
    numero_documento: numeroDocumento,
    nombre_apellidos: datos.nombre_apellidos,
    correo: datos.correo || null,
    numero_telefonico: datos.numero_telefonico || null,
    // Perfil formativo (Aprendiz/Instructor/Administrativo) sin resolver: no aporta nada a
    // estacionar un vehículo y exigirlo obligaría al vigilante a inventarlo. Se completa
    // después vía PUT /api/conductores/:id.
    tipo_usuario_id: null,
  }, { transaction });
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
    // Se limpian los datos que PERTENECÍAN a la cuenta, no solo el vínculo. El correo era
    // de solo lectura precisamente porque venía de ella (ver update): dejarlo puesto tras
    // desvincular sería conservar un dato ajeno que ya nadie mantiene, y además bloquearía
    // que esa dirección se use para otra cuenta. Los datos propios del conductor
    // (documento, nombre, teléfono, dirección, vehículos, historial) no se tocan.
    return await repo.update(id, { usuario_id: null, correo: null });
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

  // Los datos de contacto de un conductor CON cuenta vinculada son de solo lectura:
  // pertenecen a la cuenta. Editarlos aquí dejaba al conductor y a su usuario con valores
  // distintos, sin ninguna señal de cuál era el bueno. Para cambiarlos se edita la cuenta,
  // o se cancela la vinculación primero.
  if (conductor.usuario_id) {
    for (const campo of CAMPOS_DE_LA_CUENTA) {
      if (data[campo] !== undefined && data[campo] !== conductor[campo]) {
        throw {
          status: 409,
          message: `El campo "${campo}" no se puede editar desde el conductor porque proviene de su cuenta de usuario vinculada. Cámbialo en la cuenta (PUT /api/usuarios/${conductor.usuario_id}) o cancela la vinculación primero.`,
          data: { usuario_id: conductor.usuario_id, campo, valor_actual: conductor[campo], campos_solo_lectura: CAMPOS_DE_LA_CUENTA },
        };
      }
    }
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

  // Si cambia el documento y el conductor tiene cuenta, ambos se escriben juntos: o se
  // actualizan los dos, o no se actualiza ninguno.
  const cambiaDocumento = data.tipo_documento !== undefined || data.numero_documento !== undefined;
  if (!cambiaDocumento || !conductor.usuario_id) {
    return repo.update(id, data);
  }

  return sequelize.transaction(async (transaction) => {
    await _propagarDocumentoALaCuenta(conductor.usuario_id, tipoDocumentoFinal, numeroDocumentoFinal, transaction);
    return repo.update(id, data, { transaction });
  });
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
  resolverOCrear,
  update,
  desvincularUsuario,
  remove,
};
