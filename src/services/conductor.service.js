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
const { exigirSinOperaciones } = require('../utils/borrado.util');
const { ROLES } = require('../config/roles');
const PasswordUtil = require('../utils/password.util');

const TIPOS_DOCUMENTO = ['CC', 'CE', 'TI', 'PASAPORTE', 'PEP', 'NIT'];

/**
 * ¿Ese tipo de usuario es "Visitante"? Se resuelve por NOMBRE contra el catálogo, no por un
 * id fijo: el catálogo es una tabla y sus ids pueden no ser los mismos en otra instalación.
 *
 * Es la única excepción a "todo conductor tiene cuenta": alguien que entra una vez no va a
 * abrirse una cuenta en el sistema, y obligarlo dejaría al vigilante sin forma de
 * registrarlo en la barrera.
 * @private
 * @param {number|null|undefined} tipoUsuarioId
 * @returns {Promise<boolean>}
 */
const _idTipoVisitante = async () => {
  const tipos = await tipoUsuarioRepo.findAll();
  return tipos.find((t) => (t.nombre || '').trim().toLowerCase() === 'visitante')?.id ?? null;
};

const _esVisitante = async (tipoUsuarioId) => {
  if (!tipoUsuarioId) return false;
  const tipo = await tipoUsuarioRepo.findById(tipoUsuarioId);
  return (tipo?.nombre || '').trim().toLowerCase() === 'visitante';
};

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
const _resolverModoCuenta = ({ usuario_id, crear_cuenta, crearCuenta, sin_cuenta, correo }, { porDefecto } = {}) => {
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
  // El alta que ocurre dentro del panel de estacionamiento sí tiene un modo por defecto
  // (sin cuenta): allí lo normal es registrar a alguien en la barrera, no darle acceso.
  if (porDefecto) return porDefecto;

  throw {
    status: 400,
    message: 'El correo es requerido. Si esta persona no va a tener cuenta de acceso envía sin_cuenta: true; si quieres crearle una, envía crear_cuenta: true con contrasena y confirmar_contrasena',
  };
};

/**
 * Crea la cuenta de acceso de un conductor, DENTRO de la transacción que lo está creando.
 * Es el "no tengo cuenta" de los dos formularios que lo ofrecen: el alta de conductor y el
 * panel de estacionamiento. Si la creación del conductor falla después, el rollback se
 * lleva también esta cuenta.
 * @private
 * @throws {Object} 409 si el correo (o el teléfono) ya pertenecen a otra cuenta.
 * @returns {Promise<number>} El id de la cuenta creada.
 */
const _crearCuentaDeConductor = async ({ nombre_apellidos, correo, numero_telefonico, contrasena, cuerpo }, transaction) => {
  // Pidieron CREAR la cuenta, así que ese correo tiene que estar libre. Reutilizar en
  // silencio la cuenta que lo tuviera dejaba al conductor vinculado a otra persona.
  const cuentaExistente = await usuarioRepo.findByCorreo(correo);
  if (cuentaExistente) {
    throw {
      status: 409,
      message: `Ya existe una cuenta con el correo ${correo}: selecciónala en el buscador de cuentas en vez de crear una nueva`,
      data: { usuario_id: cuentaExistente.id, nombre: cuentaExistente.nombre },
    };
  }
  if (numero_telefonico) {
    const telefonoEnUso = await usuarioRepo.findByTelefono(numero_telefonico);
    if (telefonoEnUso) {
      throw { status: 409, message: 'Este número de teléfono ya está registrado en otra cuenta' };
    }
  }
  // Misma política de contraseñas que POST /api/usuarios y el registro público.
  PasswordUtil.validarNueva(contrasena, cuerpo);
  const hash = await bcrypt.hash(contrasena, 10);
  const nuevaCuenta = await usuarioRepo.create(
    {
      nombre: nombre_apellidos,
      correo,
      contrasena: hash,
      rol_id: ROLES.CONDUCTOR,
      numero_telefonico: numero_telefonico || null,
    },
    { transaction },
  );
  return nuevaCuenta.id;
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
  // regional_formacion, centro_formacion y programa_formacion ya no se piden en ningún
  // formulario: son datos de SOFIA Plus que no aportan nada a estacionar un vehículo. Se
  // ignoran si llegan; las columnas siguen en la base y lo ya guardado se conserva y se
  // sigue leyendo (v_conductor_front y los reportes de Comunidad SENA las usan).
  const {
    tipo_documento = 'CC', numero_documento, nombre_apellidos,
    direccion, tipo_usuario_id, vigencia,
    movilidad_reducida = false, tipo_discapacidad, estado = true, contrasena,
  } = data;
  // correo puede reasignarse: si se vincula una cuenta existente, manda el correo de esa
  // cuenta (ver más abajo).
  let { usuario_id, correo, numero_telefonico } = data;

  // Se decide ANTES de validar nada más: de él depende qué campos son obligatorios.
  const modoCuenta = _resolverModoCuenta(data);

  // Todo conductor necesita una cuenta de acceso, salvo los visitantes: sin ella no puede
  // consultar sus reservas ni sus vehículos, y la ficha queda a medias desde el primer día.
  // Un visitante es la excepción deliberada: entra una vez y no va a abrirse una cuenta.
  if (modoCuenta === 'SIN_CUENTA' && !(await _esVisitante(tipo_usuario_id))) {
    throw {
      status: 400,
      message: 'Un conductor necesita una cuenta de acceso: selecciona una existente, o marca "no tengo usuario" para crearla. Solo los visitantes pueden quedar sin cuenta.',
    };
  }

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
    // Lo único imprescindible para crear una cuenta es con qué entrar.
    if (!correo) throw { status: 400, message: 'El correo es requerido para crear la cuenta de acceso' };
    // Fortaleza + confirmación ANTES de tocar la base de datos, la misma política que
    // POST /api/usuarios y el registro público (PasswordUtil, un solo sitio).
    PasswordUtil.validarNueva(contrasena, data);
  }
  // El teléfono NO es obligatorio en ningún modo, igual que en el perfil de la cuenta:
  // mucha gente no lo da, y bloquear el alta por eso no protege nada. SIN_CUENTA tampoco
  // exige correo: de un visitante registrado en la barrera puede no conocerse ninguno.

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
        usuario_id = await _crearCuentaDeConductor(
          { nombre_apellidos, correo, numero_telefonico, contrasena, cuerpo: data }, transaction,
        );
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
          usuario_id = await _crearCuentaDeConductor(
            { nombre_apellidos, correo, numero_telefonico, contrasena, cuerpo: data }, transaction,
          );
        }
      }

      // El documento también es dato de la cuenta (migración 002): se propaga para que
      // ambas copias nazcan iguales y la cuenta pueda precargarlo más adelante.
      await _propagarDocumentoALaCuenta(usuario_id, tipo_documento, numero_documento, transaction);

      return repo.create({
        usuario_id, tipo_documento, numero_documento, nombre_apellidos, correo,
        direccion, numero_telefonico, tipo_usuario_id, vigencia,
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
 * La cuenta de acceso se resuelve con los mismos tres modos que POST /api/conductores, para
 * que el panel pueda ofrecer "no tengo cuenta" sin salir del formulario:
 *   - `usuario_id`          -> se vincula esa cuenta ya existente.
 *   - `crear_cuenta: true`  -> se crea, con correo + contrasena + confirmar_contrasena.
 *   - nada de lo anterior   -> conductor sin cuenta (usuario_id NULL, estado válido del
 *     modelo). Es lo normal en la barrera: nadie puede inventar una contraseña por el dueño
 *     del vehículo, y esa persona puede registrarse después.
 *
 * @param {Object} datos
 * @param {number} [datos.conductor_id] - Si viene, solo se comprueba que exista.
 * @param {string} [datos.tipo_documento='CC'] - Alias: tipoDocumento.
 * @param {string} [datos.numero_documento] - Con él se busca antes de crear nada: si esa
 *   persona ya estaba registrada se reutiliza, no se duplica.
 * @param {string} [datos.nombre_apellidos] - Obligatorio solo si hay que crearlo.
 * @param {string} [datos.correo]
 * @param {string} [datos.numero_telefonico] - Opcional, como en todo el sistema.
 * @param {number} [datos.usuario_id] - Cuenta existente a la que vincularlo.
 * @param {boolean} [datos.crear_cuenta] - Crear la cuenta de acceso de esta persona.
 * @param {string} [datos.contrasena]
 * @param {string} [datos.confirmar_contrasena]
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
  validarDiscapacidad(datos.movilidad_reducida, datos.tipo_discapacidad);

  // Cuenta de acceso: los MISMOS tres modos que POST /api/conductores, para que el
  // formulario del panel de estacionamiento pueda ofrecer "no tengo cuenta" con sus campos
  // de contraseña y confirmación. Si no se pide ninguno, el conductor nace sin cuenta, que
  // es lo normal cuando el vigilante registra a alguien en la barrera.
  const modoCuenta = _resolverModoCuenta(datos, { porDefecto: 'SIN_CUENTA' });
  let usuarioId = null;
  let correo = datos.correo || null;
  let telefono = datos.numero_telefonico || null;

  if (modoCuenta === 'VINCULAR') {
    await validarReferencias({ usuario_id: datos.usuario_id });
    // Los datos de contacto los manda la cuenta (CAMPOS_DE_LA_CUENTA); si el formulario
    // envía otros distintos se rechaza, en vez de dejar dos correos para la misma persona.
    const cuenta = await usuarioRepo.findById(datos.usuario_id);
    const deCuenta = _tomarDatosDeLaCuenta(cuenta, { correo, numero_telefonico: telefono });
    correo = deCuenta.correo;
    telefono = deCuenta.numero_telefonico;
    usuarioId = Number(datos.usuario_id);
  } else if (modoCuenta === 'CREAR') {
    if (!correo) throw { status: 400, message: 'El correo es requerido para crear la cuenta de acceso del conductor' };
    usuarioId = await _crearCuentaDeConductor(
      {
        nombre_apellidos: datos.nombre_apellidos,
        correo,
        numero_telefonico: telefono,
        contrasena: datos.contrasena,
        cuerpo: datos,
      },
      transaction,
    );
  } else if (modoCuenta === 'AUTO' && correo) {
    // Llegó un correo suelto, sin decir qué hacer con él: si ya existe esa cuenta y está
    // libre se vincula; si no, el conductor queda sin cuenta. Crear una exige contraseña,
    // y aquí nadie la ha pedido -- inventarla sería peor que no crearla.
    const cuenta = await usuarioRepo.findByCorreo(correo);
    if (cuenta && !(await repo.findByUsuarioId(cuenta.id, { transaction }))) {
      usuarioId = cuenta.id;
    }
  }

  // El documento es también dato de la cuenta (migración 002): las dos copias nacen
  // iguales, dentro de esta misma transacción.
  await _propagarDocumentoALaCuenta(usuarioId, tipoDocumento, numeroDocumento, transaction);

  return repo.create({
    usuario_id: usuarioId,
    tipo_documento: tipoDocumento,
    numero_documento: numeroDocumento,
    nombre_apellidos: datos.nombre_apellidos,
    correo,
    numero_telefonico: telefono,
    direccion: datos.direccion || null,
    // Quien se registra en la barrera sin cuenta es, por definición, un visitante: es la
    // única figura que el sistema admite sin acceso propio (ver el _esVisitante de arriba).
    // Si el panel sí pregunta el perfil, manda lo que haya elegido.
    tipo_usuario_id: datos.tipo_usuario_id || (usuarioId ? null : await _idTipoVisitante()),
    movilidad_reducida: datos.movilidad_reducida === true,
    tipo_discapacidad: datos.tipo_discapacidad || null,
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
const update = async (id, datosEnviados, usuarioId) => {
  const conductor = await getById(id);

  // Los datos de formación salieron de los formularios (ver create): si llegan, se
  // ignoran, y lo que hubiera guardado se conserva tal cual.
  const data = { ...datosEnviados };
  delete data.regional_formacion;
  delete data.centro_formacion;
  delete data.programa_formacion;

  if (data.tipo_documento && !TIPOS_DOCUMENTO.includes(data.tipo_documento)) {
    throw { status: 400, message: `Tipo de documento inválido. Permitidos: ${TIPOS_DOCUMENTO.join(', ')}` };
  }
  if (data.correo !== undefined) validarCorreo(data.correo);

  // Los datos de contacto de un conductor CON cuenta vinculada pertenecen a la cuenta: se
  // muestran, pero no se editan desde aquí. Si llegan en la petición se IGNORAN, en vez de
  // rechazar el guardado entero: el formulario los pinta en solo lectura y los reenvía tal
  // cual, así que un 409 ahí solo servía para que no se pudiera guardar ningún otro cambio.
  // Para cambiarlos de verdad se edita la cuenta (PUT /api/usuarios/:id).
  if (conductor.usuario_id) {
    for (const campo of CAMPOS_DE_LA_CUENTA) delete data[campo];
  }

  // Reactivar exige tener cuenta. Es el caso de un conductor cuya cuenta fue eliminada: se
  // quedó en pausa a propósito (ver usuario.service.remove) y volver a activarlo sin darle
  // acceso lo dejaría operando sin nadie detrás. Los visitantes no cuentan: nunca tuvieron.
  const usuarioFinal = data.usuario_id !== undefined ? data.usuario_id : conductor.usuario_id;
  const tipoUsuarioFinal = data.tipo_usuario_id !== undefined ? data.tipo_usuario_id : conductor.tipo_usuario_id;
  if (data.estado === true && !conductor.estado && !usuarioFinal && !(await _esVisitante(tipoUsuarioFinal))) {
    throw {
      status: 409,
      message: 'Este conductor no tiene cuenta de acceso: la que tenía fue eliminada. Vincúlale una cuenta para poder activarlo.',
      data: { requiere_cuenta: true, conductor_id: conductor.id },
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

  // Volver a activarlo devuelve también sus vehículos: se deshabilitaron con él al
  // eliminarse su cuenta (usuario.service.remove), así que dejarlos apagados haría que el
  // conductor volviera "activo" pero sin poder parquear nada.
  const reactivando = data.estado === true && conductor.estado === false;
  const devolverVehiculos = async (transaction) => {
    // La tabla vehiculo lleva trigger de auditoría y exige saber quién escribe, en la misma
    // transacción (ver utils/dbContext.util.js). Aquí no se puede usar runWithUsuario porque
    // ya estamos dentro de una transacción, así que se fija la variable a mano.
    await sequelize.query('SET LOCAL app.usuario_id = :usuarioId', {
      replacements: { usuarioId: String(usuarioId ?? usuarioFinal ?? conductor.usuario_id ?? 1) },
      transaction,
    });
    await sequelize.query(
      `UPDATE vehiculo SET estado = TRUE
        WHERE id IN (SELECT vehiculo_id FROM detalle_propiedad WHERE conductor_id = :id)`,
      { replacements: { id }, transaction },
    );
  };

  // Si cambia el documento y el conductor tiene cuenta, ambos se escriben juntos: o se
  // actualizan los dos, o no se actualiza ninguno.
  const cambiaDocumento = data.tipo_documento !== undefined || data.numero_documento !== undefined;
  if (!cambiaDocumento || !conductor.usuario_id) {
    if (!reactivando) return repo.update(id, data);
    return sequelize.transaction(async (transaction) => {
      await devolverVehiculos(transaction);
      return repo.update(id, data, { transaction });
    });
  }


  return sequelize.transaction(async (transaction) => {
    await _propagarDocumentoALaCuenta(conductor.usuario_id, tipoDocumentoFinal, numeroDocumentoFinal, transaction);
    if (reactivando) await devolverVehiculos(transaction);
    return repo.update(id, data, { transaction });
  });
};

/**
 * Las operaciones del parqueadero de este conductor. Son las únicas que impiden borrarlo
 * (ON DELETE RESTRICT desde la migración 005).
 * @private
 */
const OPERACIONES_DEL_CONDUCTOR = [
  { tabla: 'registro_acceso', columna: 'conductor_id', que_es: 'entradas o salidas' },
  { tabla: 'reserva', columna: 'conductor_id', que_es: 'reservas' },
];

/**
 * Elimina un conductor de verdad: la fila desaparece de la tabla.
 *
 * Lo que NO se lleva por delante:
 *   - su cuenta de acceso, si la tenía. La clave foránea va del conductor a la cuenta, no al
 *     revés: la cuenta sigue existiendo y puede vincularse a otra ficha.
 *   - sus vehículos. Solo se borra el vínculo de propiedad (detalle_propiedad, en cascada);
 *     el vehículo queda registrado y sin dueño, listo para reasignarse.
 *   - la auditoría y los historiales.
 *
 * Lo único que lo impide son sus operaciones: entradas, salidas y reservas. Ese es el
 * registro de lo que pasó en el parqueadero; para esos casos se deshabilita el conductor
 * (estado = false) en vez de borrarlo.
 *
 * @param {number} id
 * @throws {Object} 404 si no existe; 409 si tiene entradas, salidas o reservas.
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const conductor = await getById(id);

  await exigirSinOperaciones({
    referencias: OPERACIONES_DEL_CONDUCTOR,
    id,
    sujeto: `a ${conductor.nombre_apellidos}`,
    alternativa: 'Deshabilítalo en vez de borrarlo.',
    // Sin desglose: a quien intenta borrar no le sirve saber si son 3 ingresos o 2 reservas,
    // solo que hay historial que depende de esta persona. El detalle sigue en data.bloqueos.
    detallar: false,
  });

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
