/**
 * @module ConductorVinculadoUtil
 * @description Crea, dentro de la misma transacción que un alta de Usuario, un Conductor
 * vinculado (usuario_id) a partir del documento capturado en el registro público
 * (auth.controller.js `register`) o en la creación admin de usuario
 * (usuario.service.js `create`). tipo_usuario_id queda en NULL -- un admin/vigilante lo
 * completa después vía PUT /api/conductores/:id; el alta administrativa completa
 * (POST /api/conductores, ver conductor.service.js) sigue exigiéndolo tal cual.
 */

const conductorRepo = require('../repositories/conductor.repository');

// Debe coincidir con el ENUM real de conductor.tipo_documento.
const TIPOS_DOCUMENTO_VALIDOS = ['CC', 'CE', 'TI', 'PASAPORTE', 'PEP', 'NIT'];

// Definido en conductor.repository (módulo sin dependencias hacia arriba) y reexportado
// aquí, que es el punto común de la vinculación usuario<->conductor.
const { CAMPOS_DE_LA_CUENTA } = conductorRepo;

/**
 * @param {Object} datos
 * @param {number} datos.usuario_id
 * @param {string} datos.tipo_documento
 * @param {string} datos.numero_documento
 * @param {string} datos.nombre_apellidos
 * @param {string} [datos.correo]
 * @param {string} [datos.numero_telefonico]
 * @param {import('sequelize').Transaction} datos.transaction - Misma transacción del
 *   Usuario.create asociado, para que ambas escrituras sean atómicas.
 * @throws {Object} 400 si tipo_documento no es válido; 409 si el documento ya existe.
 * @returns {Promise<Object>} El conductor creado.
 */
const crearConductorVinculado = async ({
  usuario_id, tipo_documento, numero_documento, nombre_apellidos, correo, numero_telefonico, transaction,
}) => {
  const tipoNormalizado = (tipo_documento || '').toString().trim().toUpperCase();
  if (!TIPOS_DOCUMENTO_VALIDOS.includes(tipoNormalizado)) {
    throw { status: 400, message: `Tipo de documento inválido. Permitidos: ${TIPOS_DOCUMENTO_VALIDOS.join(', ')}` };
  }

  const existe = await conductorRepo.findByDocumento(tipoNormalizado, numero_documento);
  if (existe) {
    throw { status: 409, message: 'Ya existe un conductor registrado con ese documento' };
  }

  return conductorRepo.create(
    {
      usuario_id,
      tipo_documento: tipoNormalizado,
      numero_documento,
      nombre_apellidos,
      correo: correo || null,
      numero_telefonico: numero_telefonico || null,
      tipo_usuario_id: null,
    },
    { transaction },
  );
};

module.exports = { crearConductorVinculado, TIPOS_DOCUMENTO_VALIDOS, CAMPOS_DE_LA_CUENTA };
