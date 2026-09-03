/**
 * @module UsuarioService
 * @description Gestión de usuarios, autenticación y seguridad.
 * Alineado con el modelo Usuario.
 */

const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const repo = require('../repositories/usuario.repository');
const { traducirErrorTrigger } = require('../utils/dbContext.util');
const { resolverRolId } = require('../config/roles');
const { eliminarArchivoSiExiste } = require('../middlewares/upload.middleware');
const { crearConductorVinculado, TIPOS_DOCUMENTO_VALIDOS } = require('../utils/conductorVinculado.util');
const conductorRepo = require('../repositories/conductor.repository');

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
const getAll = () => repo.findAll();

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
  const conductorVinculado = await conductorRepo.findByUsuarioId(id);
  return {
    ...item,
    tipo_documento: conductorVinculado?.tipo_documento ?? null,
    numero_documento: conductorVinculado?.numero_documento ?? null,
  };
};

/**
 * Registra un nuevo usuario con contraseña cifrada. Si se envía tipo_documento +
 * numero_documento (o sus alias tipoDocumento/numeroDocumento), crea además un Conductor
 * vinculado (usuario_id) en la MISMA transacción -- ver conductorVinculado.util.js. Si el
 * documento ya está en uso, toda la transacción se revierte y no se crea el usuario.
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
  const tipoDocumento = data.tipo_documento ?? data.tipoDocumento;
  const numeroDocumento = data.numero_documento ?? data.numeroDocumento;

  if (!nombre || !correo || !contrasena) {
    throw { status: 400, message: 'nombre, correo y contrasena son requeridos' };
  }
  if ((tipoDocumento && !numeroDocumento) || (!tipoDocumento && numeroDocumento)) {
    throw { status: 400, message: 'tipo_documento y numero_documento deben enviarse juntos' };
  }
  _validarCorreo(correo);
  _validarTelefono(numero_telefonico);
  const rol_id = resolverRolId(rolEnviado) ?? 3;

  const existe = await repo.findByCorreo(correo);
  if (existe) throw { status: 409, message: 'El correo ya está registrado' };

  if (numero_telefonico) {
    const telefonoEnUso = await repo.findByTelefono(numero_telefonico);
    if (telefonoEnUso) throw { status: 409, message: 'Este número de teléfono ya está registrado en otra cuenta' };
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
      }, { transaction });

      if (tipoDocumento && numeroDocumento) {
        await crearConductorVinculado({
          usuario_id: nuevo.id,
          tipo_documento: tipoDocumento,
          numero_documento: numeroDocumento,
          nombre_apellidos: nombre,
          correo,
          numero_telefonico,
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
 * alias tipoDocumento/numeroDocumento), actualiza el documento del Conductor ya vinculado
 * a este usuario, o crea uno nuevo si todavía no tenía -- ANTES este par de campos se
 * ignoraba en silencio (ni error ni efecto), que era la causa real de "el documento no se
 * actualiza"; ver conductorVinculado.util.js para el mismo patrón usado en create()/register().
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

  // El rol puede venir como `rol` o como `rol_id`, número o nombre (ver resolverRolId).
  const updateData = { ...data };
  delete updateData.tipo_documento;
  delete updateData.tipoDocumento;
  delete updateData.numero_documento;
  delete updateData.numeroDocumento;
  const rolEnviado = updateData.rol !== undefined ? updateData.rol : updateData.rol_id;
  delete updateData.rol;
  const rolResuelto = resolverRolId(rolEnviado);
  if (rolResuelto !== undefined) updateData.rol_id = rolResuelto;

  try {
    return await sequelize.transaction(async (transaction) => {
      const actualizado = await repo.update(id, updateData, { transaction });

      if (tipoDocumentoNormalizado && numeroDocumento) {
        const conductorVinculado = await conductorRepo.findByUsuarioId(id, { transaction });
        const otroConDocumento = await conductorRepo.findByDocumento(tipoDocumentoNormalizado, numeroDocumento);
        if (otroConDocumento && (!conductorVinculado || otroConDocumento.id !== conductorVinculado.id)) {
          throw { status: 409, message: 'Ya existe un conductor registrado con ese documento' };
        }

        if (conductorVinculado) {
          await conductorRepo.update(
            conductorVinculado.id,
            { tipo_documento: tipoDocumentoNormalizado, numero_documento: numeroDocumento },
            { transaction },
          );
        } else {
          await crearConductorVinculado({
            usuario_id: id,
            tipo_documento: tipoDocumentoNormalizado,
            numero_documento: numeroDocumento,
            nombre_apellidos: updateData.nombre || usuario.nombre,
            correo: updateData.correo || usuario.correo,
            numero_telefonico: updateData.numero_telefonico || usuario.numero_telefonico,
            transaction,
          });
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
 * Elimina un usuario.
 * @param {number} id
 * @throws {Object} 404 si no existe; 409 si tiene conductor, reservas, ingresos, novedades u
 * otros registros asociados (borrarlo rompería ese histórico).
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

// El login vive solo en AuthController/auth.routes.js (POST /api/auth/login): es el
// único que aplica rate limiting, chequea `estado` (ACTIVO/INACTIVO/BLOQUEADO) y emite
// JWT. Este service no debe tener una segunda implementación de login.

module.exports = { getAll, getById, create, update, cambiarContrasena, actualizarFoto, remove };