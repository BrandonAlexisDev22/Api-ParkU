/**
 * @module ConductorVinculadoUtil
 * @description Lo común a la relación cuenta <-> conductor: los tipos de documento válidos,
 * qué campos manda la cuenta, y el alta de un Conductor a partir del REGISTRO PÚBLICO.
 *
 * `crearConductorVinculado` se usa en un único sitio a propósito: POST /api/auth/registro.
 * Ahí sí corresponde crear el perfil de conductor automáticamente, porque quien se registra
 * es la propia persona que va a parquear -- la cuenta y el conductor son el mismo ser humano,
 * y vincularlos entre sí no le quita a nadie su cuenta.
 *
 * Lo que NO debe hacerlo es el alta administrativa (POST /api/usuarios) ni la edición de una
 * cuenta: ahí un administrador crea cuentas para OTRAS personas, y fabricarles un conductor
 * dejaba esas cuentas marcadas como "ya vinculadas", fuera del selector del formulario de
 * conductores. El documento vive en la cuenta desde la migración 002, así que esos dos
 * caminos lo guardan sin necesitar ningún conductor.
 */

const conductorRepo = require('../repositories/conductor.repository');
const tipoUsuarioRepo = require('../repositories/tipoUsuario.repository');

// Debe coincidir con el ENUM real de conductor.tipo_documento.
const TIPOS_DOCUMENTO_VALIDOS = ['CC', 'CE', 'TI', 'PASAPORTE', 'PEP', 'NIT'];

// Definido en conductor.repository (módulo sin dependencias hacia arriba) y reexportado
// aquí, que es el punto común de la vinculación usuario<->conductor.
const { CAMPOS_DE_LA_CUENTA } = conductorRepo;

/**
 * Crea el Conductor de quien acaba de registrarse, en la MISMA transacción que su Usuario:
 * si algo falla (documento ya registrado, tipo de usuario inexistente), el rollback deshace
 * también la cuenta y no queda una mitad suelta.
 *
 * @param {Object} datos
 * @param {number} datos.usuario_id - La cuenta recién creada.
 * @param {string} datos.tipo_documento
 * @param {string} datos.numero_documento
 * @param {string} datos.nombre_apellidos
 * @param {string} [datos.correo]
 * @param {string} [datos.numero_telefonico] - Opcional, como en todo el sistema.
 * @param {number} [datos.tipo_usuario_id] - Perfil SENA (Aprendiz/Instructor/…). Opcional:
 *   si el formulario no lo pregunta, queda sin resolver y se completa después.
 * @param {string} [datos.direccion]
 * @param {import('sequelize').Transaction} datos.transaction
 * @throws {Object} 400 si el tipo de documento o el tipo de usuario no son válidos;
 *   409 si el documento ya pertenece a otro conductor.
 * @returns {Promise<Object>} El conductor creado.
 */
const crearConductorVinculado = async ({
  usuario_id, tipo_documento, numero_documento, nombre_apellidos, correo,
  numero_telefonico, tipo_usuario_id, direccion, transaction,
}) => {
  const tipoNormalizado = (tipo_documento || '').toString().trim().toUpperCase();
  if (!TIPOS_DOCUMENTO_VALIDOS.includes(tipoNormalizado)) {
    throw { status: 400, message: `Tipo de documento inválido. Permitidos: ${TIPOS_DOCUMENTO_VALIDOS.join(', ')}` };
  }

  const existe = await conductorRepo.findByDocumento(tipoNormalizado, numero_documento, { transaction });
  if (existe) {
    throw { status: 409, message: 'Ya existe un conductor registrado con ese documento' };
  }

  // Sin esta comprobación, un id inexistente llega a Postgres como violación de clave
  // foránea y sube como un 500 ilegible en vez de decir cuál es el campo malo.
  if (tipo_usuario_id) {
    const tipoUsuario = await tipoUsuarioRepo.findById(tipo_usuario_id);
    if (!tipoUsuario) throw { status: 400, message: 'El tipo de usuario indicado no existe' };
  }

  return conductorRepo.create(
    {
      usuario_id,
      tipo_documento: tipoNormalizado,
      numero_documento,
      nombre_apellidos,
      correo: correo || null,
      numero_telefonico: numero_telefonico || null,
      tipo_usuario_id: tipo_usuario_id || null,
      direccion: direccion || null,
    },
    { transaction },
  );
};

module.exports = { crearConductorVinculado, TIPOS_DOCUMENTO_VALIDOS, CAMPOS_DE_LA_CUENTA };
