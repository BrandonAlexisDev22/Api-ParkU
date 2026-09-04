/**
 * @module ConductorVinculadoUtil
 * @description Lo común a la relación cuenta <-> conductor: los tipos de documento válidos
 * y qué campos manda la cuenta.
 *
 * Aquí vivía `crearConductorVinculado`, que creaba un Conductor automáticamente cada vez
 * que se registraba o se editaba un Usuario con documento. Ya no existe, a propósito: crear
 * una cuenta no debe crear un perfil de conductor. El documento se guarda en la propia
 * cuenta (migración 002), y el perfil de conductor nace solo cuando de verdad hace falta:
 *   - al darlo de alta a mano (POST /api/conductores, ver conductor.service.js), o
 *   - al registrar su vehículo para parquearlo, si esa persona todavía no estaba
 *     (conductor.service.resolverOCrear).
 * Mientras se creaba solo, toda cuenta con documento aparecía como "ya vinculada a otro
 * conductor" y el formulario de alta no podía ofrecerla.
 */

const conductorRepo = require('../repositories/conductor.repository');

// Debe coincidir con el ENUM real de conductor.tipo_documento.
const TIPOS_DOCUMENTO_VALIDOS = ['CC', 'CE', 'TI', 'PASAPORTE', 'PEP', 'NIT'];

// Definido en conductor.repository (módulo sin dependencias hacia arriba) y reexportado
// aquí, que es el punto común de la vinculación usuario<->conductor.
const { CAMPOS_DE_LA_CUENTA } = conductorRepo;

module.exports = { TIPOS_DOCUMENTO_VALIDOS, CAMPOS_DE_LA_CUENTA };
