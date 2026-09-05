/**
 * @module UsuarioService
 * @description Gestión de usuarios, autenticación y seguridad.
 * Alineado con el modelo Usuario.
 */

const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const repo = require('../repositories/usuario.repository');
const { runWithUsuario, traducirErrorTrigger } = require('../utils/dbContext.util');
const { exigirSinOperaciones } = require('../utils/borrado.util');
const { ROLES, ALIAS_ROL } = require('../config/roles');
const rolRepo = require('../repositories/rol.repository');
const { eliminarArchivoSiExiste } = require('../middlewares/upload.middleware');
const { crearConductorVinculado, TIPOS_DOCUMENTO_VALIDOS } = require('../utils/conductorVinculado.util');
const conductorRepo = require('../repositories/conductor.repository');
const { CAMPOS_DE_LA_CUENTA } = conductorRepo;
const PasswordUtil = require('../utils/password.util');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Formato permisivo (con o sin '+', 7-15 dígitos) -- el mismo criterio que ya se usaba en
// el registro público (isMobilePhone('any')), pero validado aquí en el service para que
// también aplique al alta/edición hecha por un administrador vía /api/usuarios.
const TELEFONO_REGEX = /^\+?[0-9]{7,15}$/;

/**
 * @private
 * @throws {Object} 400 si el correo no tiene formato válido.
 */
const _validarCorreo = (correo) => {
  if (!EMAIL_REGEX.test(correo)) {
    throw { status: 400, message: 'El correo electrónico no tiene un formato válido' };
  }
};

/**
 * @private
 * @throws {Object} 400 si el teléfono (cuando viene) no tiene un formato válido.
 */
const _validarTelefono = (numero) => {
  if (numero && !TELEFONO_REGEX.test(String(numero).replace(/[\s-]/g, ''))) {
    throw { status: 400, message: 'El número de teléfono no tiene un formato válido' };
  }
};

/**
 * Obtiene todos los usuarios (sin contraseñas).
 * @returns {Promise<Array>}
 */
/**
 * Normaliza texto para comparar nombres de rol sin depender de tildes ni mayúsculas
 * ("Comunidad SENA", "comunidad sena" y "COMUNIDAD SENÁ" son el mismo rol).
 * @private
 */
const _normalizarTexto = (texto) => texto
  .toString().trim().toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Resuelve el rol que envía el cliente CONTRA LA TABLA `rol` REAL, no contra una lista
 * fija en el código. Acepta el id (número o string numérico) o el nombre del rol.
 *
 * Antes esto lo hacía config/roles.js validando contra ROLES = {ADMIN:1, VIGILANTE:2,
 * CONDUCTOR:3}: crear un rol nuevo desde POST /api/roles funcionaba, pero asignárselo a un
 * usuario respondía "Rol inválido" porque ese id no estaba en la constante. Ahora cualquier
 * rol que exista en la base de datos es asignable el mismo día que se crea, sin tocar código.
 *
 * @private
 * @param {number|string|undefined|null} valor
 * @throws {Object} 400 si el valor no corresponde a ningún rol existente. El mensaje lista
 *   los roles reales, para que el cliente sepa qué puede enviar.
 * @returns {Promise<number|undefined>} undefined si no vino nada (el caller pone el default).
 */
const _resolverRol = async (valor) => {
  if (valor === undefined || valor === null || valor === '') return undefined;

  const roles = await rolRepo.findAll();

  const comoNumero = Number(valor);
  if (Number.isInteger(comoNumero) && comoNumero > 0) {
    const porId = roles.find((r) => r.id === comoNumero);
    if (porId) return porId.id;
  } else if (typeof valor === 'string') {
    const buscado = _normalizarTexto(valor);
    const porNombre = roles.find((r) => _normalizarTexto(r.nombre) === buscado);
    if (porNombre) return porNombre.id;

    // Alias históricos ("conductor" -> "Comunidad sena"): el nombre real cambió pero los
    // clientes viejos siguen enviando el antiguo.
    const porAlias = ALIAS_ROL[buscado];
    if (porAlias && roles.some((r) => r.id === porAlias)) return porAlias;
  }

  throw {
    status: 400,
    message: `Rol inválido: "${valor}". Roles disponibles: ${roles.map((r) => `${r.id} (${r.nombre})`).join(', ')}`,
  };
};

/**
 * Lista usuarios, opcionalmente filtrados por rol.
 *
 * El filtro acepta cualquier rol que exista en la base de datos (por id o por nombre); no
 * hay una lista cerrada de tres. Las opciones del desplegable las da GET /api/roles, así
 * que un rol creado hoy aparece hoy en el filtro sin desplegar nada.
 *
 * @param {Object} [filtros]
 * @param {number|string} [filtros.rol] - Id o nombre del rol. Alias: rol_id.
 * @throws {Object} 400 si el rol indicado no existe.
 * @returns {Promise<Array>}
 */
const getAll = async (filtros = {}) => {
  const rolEnviado = filtros.rol !== undefined ? filtros.rol : filtros.rol_id;
  const rol_id = await _resolverRol(rolEnviado);
  return repo.findAll({ rol_id });
};

/**
 * Busca un usuario por ID.
 * @param {number} id 
 * @throws {Object} 404 si no existe.
 * @returns {Promise<Object>}
 */
/**
 * Busca un usuario por ID e incluye un resumen de su documento (tipo_documento/
 * numero_documento) si tiene un Conductor vinculado -- sin esto, el frontend no tenía
 * ninguna forma de recuperar el documento de "el usuario logueado" salvo adivinar su
 * conductor_id (ver también GET /api/conductores/usuario/:usuarioId, que da el registro
 * de Conductor completo).
 * @param {number} id
 * @throws {Object} 404 si no existe.
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Usuario no encontrado' };
  // El documento ya viene resuelto por el repositorio (include del Conductor vinculado),
  // igual que en el listado. Antes se resolvía aquí con una segunda consulta, que además
  // dejaba al listado sin documento porque no pasaba por este camino.
  return item;
};

/**
 * Todo lo que necesita el formulario de "Nuevo conductor" al seleccionar una cuenta de
 * acceso: qué valores precargar y cuáles debe dejar bloqueados.
 *
 * Existe porque esa pantalla tenía que armarlo a mano cruzando varias respuestas, y sin
 * saber qué campos son de la cuenta terminaba dejándolos editables (y desincronizables).
 * `prefill` viene con los nombres de campo del CONDUCTOR, no los del usuario, para que se
 * pueda volcar directo en el formulario.
 *
 * @param {number} id - ID de la cuenta de usuario.
 * @throws {Object} 404 si el usuario no existe.
 * @returns {Promise<Object>}
 */
const getDatosVinculacion = async (id) => {
  const usuario = await getById(id);

  return {
    usuario,
    // Si ya pertenece a un conductor, esta cuenta no se puede volver a vincular: el
    // formulario debería mostrarla deshabilitada en el buscador.
    ya_vinculado: usuario.ya_vinculado,
    conductor_vinculado: usuario.conductor_vinculado,
    prefill: {
      nombre_apellidos: usuario.conductor_vinculado?.nombre_apellidos ?? usuario.nombre ?? null,
      correo: usuario.correo ?? null,
      numero_telefonico: usuario.numero_telefonico ?? null,
      tipo_documento: usuario.tipo_documento ?? null,
      numero_documento: usuario.numero_documento ?? null,
    },
    // El documento SÍ es de la cuenta (migración 002), así que normalmente ya viene en
    // prefill. Solo hay que capturarlo cuando esa cuenta todavía no lo tenga -- las que se
    // crearon antes de la migración y nunca fueron conductor.
    campos_solo_lectura: [...CAMPOS_DE_LA_CUENTA],
    campos_a_capturar: usuario.numero_documento ? [] : ['tipo_documento', 'numero_documento'],
  };
};

/**
 * Comprueba, campo a campo, si un correo, un teléfono o un documento ya están ocupados.
 *
 * Es lo que necesita un formulario para avisar MIENTRAS se escribe, en vez de dejar que se
 * rellene entero y descubrir el choque al guardar (que es lo que pasaba: el 409 llegaba al
 * pulsar "Crear", con todos los demás campos ya escritos).
 *
 * Mira las DOS tablas donde puede estar el dato: `usuario` (cuentas de acceso) y
 * `conductor` (personas registradas, que pueden existir sin cuenta). Un correo libre en
 * una pero usado en la otra no es un correo libre: crear con él fallaría igualmente.
 *
 * @param {Object} criterios - Al menos uno.
 * @param {string} [criterios.correo]
 * @param {string} [criterios.numero_telefonico]
 * @param {string} [criterios.tipo_documento] - Junto con numero_documento.
 * @param {string} [criterios.numero_documento]
 * @param {number} [criterios.excluir_usuario_id] - Cuenta que se está editando: sus propios
 *   valores no se cuentan como ocupados (si no, editar sin tocar el correo lo marcaría
 *   siempre en rojo).
 * @throws {Object} 400 si no se envía ningún criterio.
 * @returns {Promise<Object>} Un bloque por campo consultado y un `disponible` global.
 */
const comprobarDisponibilidad = async (criterios = {}) => {
  const correo = criterios.correo ? String(criterios.correo).trim().toLowerCase() : null;
  const telefono = criterios.numero_telefonico ? String(criterios.numero_telefonico).trim() : null;
  const numeroDocumento = criterios.numero_documento ? String(criterios.numero_documento).trim() : null;
  const tipoDocumento = criterios.tipo_documento ? String(criterios.tipo_documento).trim().toUpperCase() : null;
  const excluirId = criterios.excluir_usuario_id ? Number(criterios.excluir_usuario_id) : null;

  if (!correo && !telefono && !numeroDocumento) {
    throw { status: 400, message: 'Envía al menos uno: correo, numero_telefonico o tipo_documento + numero_documento' };
  }
  if ((tipoDocumento && !numeroDocumento) || (!tipoDocumento && numeroDocumento)) {
    throw { status: 400, message: 'tipo_documento y numero_documento deben enviarse juntos' };
  }

  const resultado = {};

  if (correo) {
    const bloque = { valor: correo, disponible: true, motivo: null };
    if (!EMAIL_REGEX.test(correo)) {
      bloque.disponible = false;
      bloque.motivo = 'El correo electrónico no tiene un formato válido';
    } else {
      const cuenta = await repo.findByCorreo(correo);
      if (cuenta && cuenta.id !== excluirId) {
        bloque.disponible = false;
        bloque.motivo = 'Ya existe una cuenta de acceso con ese correo';
        bloque.usuario_id = cuenta.id;
        bloque.nombre = cuenta.nombre;
      } else {
        // El correo puede estar ocupado por un conductor sin cuenta: conductor.correo tiene
        // su propia validación de duplicados, y el alta fallaría igual al guardar.
        const conductores = (await conductorRepo.findByCorreo(correo))
          .filter((c) => !excluirId || c.usuario_id !== excluirId);
        if (conductores.length > 0) {
          bloque.disponible = false;
          bloque.motivo = `Ese correo ya pertenece al conductor ${conductores[0].nombre_apellidos}`;
          bloque.conductor_id = conductores[0].id;
        }
      }
    }
    resultado.correo = bloque;
  }

  if (telefono) {
    const bloque = { valor: telefono, disponible: true, motivo: null };
    if (!TELEFONO_REGEX.test(telefono.replace(/[\s-]/g, ''))) {
      bloque.disponible = false;
      bloque.motivo = 'El número de teléfono no tiene un formato válido';
    } else {
      const cuenta = await repo.findByTelefono(telefono);
      if (cuenta && cuenta.id !== excluirId) {
        bloque.disponible = false;
        bloque.motivo = 'Ese número de teléfono ya está registrado en otra cuenta';
        bloque.usuario_id = cuenta.id;
      }
    }
    resultado.numero_telefonico = bloque;
  }

  if (numeroDocumento) {
    const bloque = {
      tipo_documento: tipoDocumento, numero_documento: numeroDocumento, disponible: true, motivo: null,
    };
    if (!TIPOS_DOCUMENTO_VALIDOS.includes(tipoDocumento)) {
      bloque.disponible = false;
      bloque.motivo = `Tipo de documento inválido. Permitidos: ${TIPOS_DOCUMENTO_VALIDOS.join(', ')}`;
    } else {
      const cuenta = await repo.findByDocumento(tipoDocumento, numeroDocumento);
      const conductor = await conductorRepo.findByDocumento(tipoDocumento, numeroDocumento);
      if (cuenta && cuenta.id !== excluirId) {
        bloque.disponible = false;
        bloque.motivo = `Ese documento ya está registrado en la cuenta ${cuenta.correo}`;
        bloque.usuario_id = cuenta.id;
      } else if (conductor && (!excluirId || conductor.usuario_id !== excluirId)) {
        bloque.disponible = false;
        bloque.motivo = `Ese documento ya pertenece al conductor ${conductor.nombre_apellidos}`;
        bloque.conductor_id = conductor.id;
      }
      // El conductor encontrado se devuelve aunque el documento esté "ocupado" por él
      // mismo: el formulario de vinculación lo usa para ofrecer "es esta persona".
      if (conductor) bloque.conductor_id = conductor.id;
    }
    resultado.documento = bloque;
  }

  resultado.disponible = Object.values(resultado).every((b) => b.disponible !== false);
  return resultado;
};

/**
 * Registra un nuevo usuario con contraseña cifrada. El documento (tipo_documento +
 * numero_documento, o sus alias tipoDocumento/numeroDocumento) se guarda EN LA CUENTA
 * (migración 002).
 *
 * Si además la cuenta es del rol **Conductor**, se le crea su perfil de conductor vinculado
 * en la misma transacción, con el tipo_usuario_id que venga: un conductor es justamente
 * quien va a parquear, así que ese perfil le hace falta desde el primer día. Los demás roles
 * (Administrador, Vigilante, roles creados a medida) NO lo llevan -- creárselo dejaba su
 * cuenta marcada como "ya vinculada" y fuera del selector del módulo de conductores.
 *
 * Si el documento ya pertenece a otra cuenta o a otro conductor, toda la transacción se
 * revierte y no se crea el usuario.
 * @param {Object} data - Datos del usuario. Acepta el rol como `rol` o `rol_id` (número o
 *   nombre: "Administrador"/"Vigilante"/"Conductor"); si no viene, queda en Conductor.
 * @throws {Object} 400 si faltan campos obligatorios o el correo/teléfono/rol/documento no
 *   son válidos; 409 si el correo, el teléfono o el documento ya están registrados.
 * @returns {Promise<Object>}
 */
const create = async (data) => {
  const { nombre, correo, contrasena, estado, numero_telefonico } = data;
  // El cliente puede enviar el rol como `rol` o como `rol_id` -- antes solo se leía `rol`,
  // así que un cliente que mandara `rol_id` (el nombre real de la columna) terminaba
  // siempre en el default (Conductor) sin que nada lo avisara.
  const rolEnviado = data.rol !== undefined ? data.rol : data.rol_id;
  const numeroDocumento = data.numero_documento ?? data.numeroDocumento;
  // Se normaliza aquí, una vez: la columna es un ENUM y un "cc" en minúsculas lo rechaza
  // Postgres con "invalid input value for enum", que sube como 500 en vez de un 400 claro.
  const tipoDocumento = (data.tipo_documento ?? data.tipoDocumento)
    ? String(data.tipo_documento ?? data.tipoDocumento).trim().toUpperCase()
    : undefined;
  // Perfil SENA (Aprendiz/Instructor/…) del conductor que acompaña a una cuenta de rol
  // Conductor. En la cuenta no se guarda: la tabla usuario no tiene nada equivalente.
  const tipoUsuarioId = data.tipo_usuario_id ?? data.tipoUsuarioId;
  const direccion = data.direccion;

  if (!nombre || !correo || !contrasena) {
    throw { status: 400, message: 'nombre, correo y contrasena son requeridos' };
  }
  // Fortaleza + confirmación, ANTES de tocar la base de datos. La fortaleza ya la exigía
  // el registro público (registerValidation), pero esta ruta no pasa por esa cadena: un
  // administrador podía crear cuentas con contraseñas triviales. La confirmación no
  // existía en ninguna de las dos.
  PasswordUtil.validarNueva(contrasena, data);
  if ((tipoDocumento && !numeroDocumento) || (!tipoDocumento && numeroDocumento)) {
    throw { status: 400, message: 'tipo_documento y numero_documento deben enviarse juntos' };
  }
  if (tipoDocumento && !TIPOS_DOCUMENTO_VALIDOS.includes(tipoDocumento)) {
    throw { status: 400, message: `Tipo de documento inválido. Permitidos: ${TIPOS_DOCUMENTO_VALIDOS.join(', ')}` };
  }
  _validarCorreo(correo);
  _validarTelefono(numero_telefonico);
  // Se resuelve contra la tabla `rol` real (ver _resolverRol). Sin rol explícito, la
  // cuenta nace como Conductor, que es el rol de menor privilegio.
  const rol_id = (await _resolverRol(rolEnviado)) ?? ROLES.CONDUCTOR;

  const existe = await repo.findByCorreo(correo);
  if (existe) throw { status: 409, message: 'El correo ya está registrado' };

  if (numero_telefonico) {
    const telefonoEnUso = await repo.findByTelefono(numero_telefonico);
    if (telefonoEnUso) throw { status: 409, message: 'Este número de teléfono ya está registrado en otra cuenta' };
  }

  // El documento se comprueba ANTES de escribir: hay un índice único parcial
  // (usuario_documento_idx) que, si se llega a él, responde con el error crudo de Postgres
  // -- un 500 ilegible en vez de este 409 que dice de quién es.
  if (tipoDocumento && numeroDocumento) {
    const documentoEnUso = await repo.findByDocumento(tipoDocumento, numeroDocumento);
    if (documentoEnUso) {
      throw {
        status: 409,
        message: `El documento ${tipoDocumento} ${numeroDocumento} ya está registrado en la cuenta ${documentoEnUso.correo}`,
        data: { usuario_id: documentoEnUso.id, correo: documentoEnUso.correo },
      };
    }
  }

  const hash = await bcrypt.hash(contrasena, 10);

  try {
    return await sequelize.transaction(async (transaction) => {
      const nuevo = await repo.create({
        nombre,
        correo,
        contrasena: hash,
        rol_id,
        estado: estado !== undefined ? estado : 'ACTIVO',
        numero_telefonico: numero_telefonico || null,
        // El documento se guarda TAMBIÉN en la cuenta (migración 002), no solo en el
        // Conductor. Es lo que permite que una cuenta lo tenga aunque todavía no sea
        // conductor, y que al darla de alta como tal venga precargado.
        tipo_documento: tipoDocumento || null,
        numero_documento: numeroDocumento || null,
      }, { transaction });

      // El perfil de conductor SOLO para las cuentas de rol Conductor: son las que van a
      // parquear. Para cualquier otro rol no se crea nada -- una cuenta de Administrador o
      // de Vigilante con perfil de conductor quedaba marcada como "ya vinculada" y
      // desaparecía del selector del módulo de conductores.
      if (rol_id === ROLES.CONDUCTOR && tipoDocumento && numeroDocumento) {
        await crearConductorVinculado({
          usuario_id: nuevo.id,
          tipo_documento: tipoDocumento,
          numero_documento: numeroDocumento,
          nombre_apellidos: nombre,
          correo,
          numero_telefonico: numero_telefonico || null,
          tipo_usuario_id: tipoUsuarioId || null,
          direccion,
          transaction,
        });
      }

      return nuevo;
    });
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

/**
 * Actualiza parcialmente un usuario. Si se envía tipo_documento + numero_documento (o sus
 * alias tipoDocumento/numeroDocumento), el documento se escribe en la cuenta y -- SOLO si
 * esa cuenta ya tiene un Conductor vinculado -- también en él, en la misma transacción,
 * para que las dos copias no se separen. Editar una cuenta NUNCA crea un Conductor.
 * @param {number} id
 * @param {Object} data - Campos a actualizar
 * @throws {Object} 404 si no existe, 400 si el documento no es válido, 409 si correo/
 *   teléfono/documento duplicado.
 * @returns {Promise<Object>}
 */
const update = async (id, data) => {
  const usuario = await getById(id);

  // Si se actualiza el correo, verificar formato y que no esté en uso por otro usuario
  if (data.correo && data.correo !== usuario.correo) {
    _validarCorreo(data.correo);
    const duplicado = await repo.findByCorreo(data.correo);
    if (duplicado && duplicado.id !== id) {
      throw { status: 409, message: 'El correo ya está registrado por otro usuario' };
    }
  }

  // Igual chequeo para el teléfono de la cuenta
  if (data.numero_telefonico && data.numero_telefonico !== usuario.numero_telefonico) {
    _validarTelefono(data.numero_telefonico);
    const duplicado = await repo.findByTelefono(data.numero_telefonico);
    if (duplicado && duplicado.id !== id) {
      throw { status: 409, message: 'Este número de teléfono ya está registrado en otra cuenta' };
    }
  }

  // Si se actualiza la contraseña (no se permite en este método, solo en cambiarContrasena)
  if (data.contrasena) {
    throw { status: 400, message: 'Para cambiar la contraseña use el endpoint específico' };
  }

  const tipoDocumento = data.tipo_documento ?? data.tipoDocumento;
  const numeroDocumento = data.numero_documento ?? data.numeroDocumento;
  if ((tipoDocumento && !numeroDocumento) || (!tipoDocumento && numeroDocumento)) {
    throw { status: 400, message: 'tipo_documento y numero_documento deben enviarse juntos' };
  }
  let tipoDocumentoNormalizado;
  if (tipoDocumento) {
    tipoDocumentoNormalizado = tipoDocumento.toString().trim().toUpperCase();
    if (!TIPOS_DOCUMENTO_VALIDOS.includes(tipoDocumentoNormalizado)) {
      throw { status: 400, message: `Tipo de documento inválido. Permitidos: ${TIPOS_DOCUMENTO_VALIDOS.join(', ')}` };
    }
  }

  // El rol puede venir como `rol` o como `rol_id`, número o nombre (ver _resolverRol).
  const updateData = { ...data };
  delete updateData.tipo_documento;
  delete updateData.tipoDocumento;
  delete updateData.numero_documento;
  delete updateData.numeroDocumento;
  const rolEnviado = updateData.rol !== undefined ? updateData.rol : updateData.rol_id;
  delete updateData.rol;
  const rolResuelto = await _resolverRol(rolEnviado);
  if (rolResuelto !== undefined) updateData.rol_id = rolResuelto;

  // El documento se escribe en la cuenta Y en el Conductor vinculado, en la misma
  // transacción, para que las dos copias no se separen nunca.
  if (tipoDocumentoNormalizado && numeroDocumento) {
    // Comprobación previa contra el índice único usuario_documento_idx: sin ella, el choque
    // llega como el error genérico de Postgres ("Ya existe un registro con esos datos") y
    // el cliente no sabe qué campo lo causó.
    const otraCuenta = await repo.findByDocumento(tipoDocumentoNormalizado, numeroDocumento);
    if (otraCuenta && otraCuenta.id !== Number(id)) {
      throw {
        status: 409,
        message: `El documento ${tipoDocumentoNormalizado} ${numeroDocumento} ya está registrado en la cuenta ${otraCuenta.correo}`,
        data: { usuario_id: otraCuenta.id, correo: otraCuenta.correo },
      };
    }
    updateData.tipo_documento = tipoDocumentoNormalizado;
    updateData.numero_documento = numeroDocumento;
  }

  try {
    return await sequelize.transaction(async (transaction) => {
      const actualizado = await repo.update(id, updateData, { transaction });

      if (tipoDocumentoNormalizado && numeroDocumento) {
        const conductorVinculado = await conductorRepo.findByUsuarioId(id, { transaction });
        const otroConDocumento = await conductorRepo.findByDocumento(tipoDocumentoNormalizado, numeroDocumento);
        if (otroConDocumento && (!conductorVinculado || otroConDocumento.id !== conductorVinculado.id)) {
          throw { status: 409, message: 'Ya existe un conductor registrado con ese documento' };
        }

        // Solo se sincroniza el Conductor que YA existe. Editar una cuenta no crea uno:
        // el documento vive en la cuenta desde la migración 002, así que no hace falta un
        // perfil de conductor para guardarlo. Antes se creaba aquí, y por eso a una cuenta
        // a la que solo se le corregía el documento le aparecía de la nada un conductor
        // que nadie pidió -- y esa cuenta quedaba marcada como "ya vinculada".
        if (conductorVinculado) {
          await conductorRepo.update(
            conductorVinculado.id,
            { tipo_documento: tipoDocumentoNormalizado, numero_documento: numeroDocumento },
            { transaction },
          );
        }
      }

      return actualizado;
    });
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

/**
 * Cambia la contraseña verificando la anterior.
 * @param {number} id 
 * @param {Object} passwordData - { actual, nueva }
 * @throws {Object} 400 si faltan datos, 401 si actual incorrecta.
 * @returns {Promise<void>}
 */
const cambiarContrasena = async (id, { actual, nueva }) => {
  if (!actual || !nueva) {
    throw { status: 400, message: 'actual y nueva son requeridos' };
  }

  const usuario = await repo.findById(id);
  if (!usuario) throw { status: 404, message: 'Usuario no encontrado' };

  // Obtener el usuario completo (con contraseña) para validar
  const usuarioCompleto = await repo.findByCorreo(usuario.correo);
  const ok = await bcrypt.compare(actual, usuarioCompleto.contrasena);
  if (!ok) throw { status: 401, message: 'Contraseña actual incorrecta' };

  const hash = await bcrypt.hash(nueva, 10);
  await repo.updateContrasena(id, hash);
};

/**
 * Actualiza la foto de perfil del propio usuario autenticado. Reemplaza (y borra del
 * disco, best-effort) la foto anterior si existía.
 * @param {number} id
 * @param {string} nuevaRutaPublica - p. ej. '/uploads/perfiles/<uuid>.jpg'.
 * @throws {Object} 404 si el usuario no existe.
 * @returns {Promise<Object>}
 */
const actualizarFoto = async (id, nuevaRutaPublica) => {
  const usuario = await getById(id);
  eliminarArchivoSiExiste(usuario.foto_perfil_url);
  return repo.update(id, { foto_perfil_url: nuevaRutaPublica });
};

/**
 * Las operaciones del parqueadero hechas POR esta cuenta. Son las únicas que impiden
 * borrarla: la base de datos las protege con ON DELETE RESTRICT (migración 005) y aquí se
 * comprueban antes para poder decir cuáles son, en vez de soltar el error de Postgres.
 *
 * El resto de lo que cuelga de un usuario ya no hace falta tocarlo: la migración 005 dejó
 * cada clave foránea con su regla. La auditoría y los historiales pasan a SET NULL (el
 * rastro del cambio sobre la celda o el parqueadero se conserva, solo pierde el nombre de
 * quien lo hizo); las notificaciones, tokens, turnos y valoraciones se van en CASCADE; y el
 * conductor se desvincula solo, con su documento, sus vehículos y su historial intactos.
 * @private
 */
const OPERACIONES_DEL_USUARIO = [
  { tabla: 'registro_acceso', columna: 'usuario_ingreso_id', que_es: 'ingresos registrados' },
  { tabla: 'reserva', columna: 'usuario_registra_id', que_es: 'reservas registradas' },
  { tabla: 'novedad', columna: 'usuario_reporta_id', que_es: 'novedades reportadas' },
];

/**
 * Elimina un usuario DE VERDAD: la fila desaparece de la tabla `usuario`, no se marca como
 * inactiva.
 *
 * Solo lo impiden las operaciones del parqueadero (entradas y salidas, reservas, novedades):
 * son el registro de lo que pasó, y perderlas por borrar una cuenta sería peor que no poder
 * borrarla. Para esos casos está desactivar la cuenta.
 *
 * @param {number} id
 * @param {number} [solicitanteId] - Quién pide el borrado (para la auditoría y para no
 *   dejarle borrarse a sí mismo).
 * @throws {Object} 404 si no existe; 409 si es su propia cuenta, si es el último
 *   administrador activo, o si tiene operaciones registradas.
 * @returns {Promise<boolean>}
 */
const remove = async (id, solicitanteId) => {
  const usuario = await getById(id);

  if (solicitanteId && Number(solicitanteId) === Number(id)) {
    throw { status: 409, message: 'No puedes eliminar tu propia cuenta' };
  }

  // Quedarse sin ningún administrador activo deja el sistema sin nadie que pueda
  // administrarlo -- y esta acción no se puede deshacer.
  if (usuario.rol_id === ROLES.ADMIN && usuario.estado === 'ACTIVO') {
    const [filas] = await sequelize.query(
      "SELECT count(*)::int AS n FROM usuario WHERE rol_id = :rol AND estado = 'ACTIVO'",
      { replacements: { rol: ROLES.ADMIN } },
    );
    if (filas[0].n <= 1) {
      throw { status: 409, message: 'Es el único administrador activo del sistema: no se puede eliminar' };
    }
  }

  await exigirSinOperaciones({
    referencias: OPERACIONES_DEL_USUARIO,
    id,
    sujeto: `a ${usuario.nombre}`,
    alternativa: 'Desactiva la cuenta en vez de borrarla.',
  });

  try {
    return await runWithUsuario(solicitanteId ?? ROLES.ADMIN, async (transaction) => {
      // verificacion_correo no tiene clave foránea declarada, así que la cascada de la base
      // de datos no la alcanza: se limpia a mano para no dejar tokens de una cuenta que ya
      // no existe.
      await sequelize.query('DELETE FROM verificacion_correo WHERE usuario_id = :id', {
        replacements: { id }, transaction,
      });
      // El conductor se desvincula solo (ON DELETE SET NULL), pero el correo era de la
      // cuenta: si se queda puesto, esa dirección seguiría reservada para nadie.
      await sequelize.query('UPDATE conductor SET correo = NULL WHERE usuario_id = :id', {
        replacements: { id }, transaction,
      });
      return repo.remove(id, { transaction });
    });
  } catch (error) {
    traducirErrorTrigger(error);
  }
};

// El login vive solo en AuthController/auth.routes.js (POST /api/auth/login): es el
// único que chequea `estado` (ACTIVO/INACTIVO/BLOQUEADO) y emite JWT.
// Este service no debe tener una segunda implementación de login.

module.exports = {
  getAll, getById, getDatosVinculacion, comprobarDisponibilidad, create, update, cambiarContrasena, actualizarFoto, remove,
};