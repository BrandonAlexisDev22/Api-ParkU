/**
 * @module ConductorRepository
 * @description Operaciones de base de datos para la tabla 'conductor' usando Sequelize.
 * regional_formacion/centro_formacion/programa_formacion son texto libre (dato de SOFIA
 * Plus), ya no catálogos con FK propia.
 */

const { Conductor, TipoUsuario, Usuario } = require('../models');

/**
 * Campos del conductor cuyo dueño es la CUENTA de usuario, no el conductor.
 *
 * Cuando hay una cuenta vinculada estos valores salen de ella y no se editan desde el
 * conductor: el correo es la credencial de acceso (y la dirección ya verificada), y el
 * teléfono es el contacto de la cuenta. Si se pudieran editar aquí, la misma persona
 * acabaría con dos correos y dos teléfonos distintos sin forma de saber cuál vale.
 *
 * Se define aquí, en el módulo sin dependencias hacia arriba, para que la validación del
 * backend y el `campos_solo_lectura` que consume el formulario usen la MISMA lista.
 * (conductorVinculado.util lo reexporta; definirlo allí crearía un ciclo, porque ese
 * módulo ya importa este repositorio.)
 */
const CAMPOS_DE_LA_CUENTA = ['correo', 'numero_telefonico'];

const includeCatalogos = [
  { model: TipoUsuario, as: 'tipoUsuario', attributes: ['nombre'] },
  // La cuenta vinculada se trae completa (sin datos sensibles: nunca la contraseña) para
  // que quien consulte un conductor vea de una vez con qué usuario está vinculado y pueda
  // detectar desajustes -- p. ej. un correo distinto entre conductor y cuenta.
  {
    model: Usuario,
    as: 'usuario',
    attributes: ['id', 'nombre', 'correo', 'numero_telefonico', 'rol_id', 'estado'],
  },
];

/**
 * Aplana el resultado de Sequelize: expone el nombre del tipo de usuario como campo plano
 * y la cuenta vinculada como objeto `usuario`.
 *
 * Antes el include traía el nombre de la cuenta y el mapper LO DESCARTABA: de todo el
 * usuario vinculado solo sobrevivía `usuario_correo`, así que la pantalla de vinculación no
 * tenía forma de mostrar a quién estaba vinculado el conductor. `usuario_correo` se
 * conserva para no romper a quien ya lo usaba.
 * @param {import('sequelize').Model} instancia
 * @returns {Object|null}
 */
const mapConductor = (instancia) => {
  if (!instancia) return null;
  const plano = instancia.toJSON();
  const { tipoUsuario, usuario, ...resto } = plano;
  return {
    ...resto,
    tipo_usuario_nombre: tipoUsuario ? tipoUsuario.nombre : null,
    usuario: usuario || null,
    usuario_correo: usuario ? usuario.correo : null,
    usuario_nombre: usuario ? usuario.nombre : null,
    // Deja explícito si el correo del conductor y el de su cuenta se separaron: el correo
    // no debería editarse en el conductor cuando viene de una cuenta (ver el service).
    correo_sincronizado: usuario ? usuario.correo === resto.correo : null,
    // Qué campos debe deshabilitar el formulario. Los datos que provienen de la cuenta no
    // se editan desde el conductor (el backend los rechaza con 409); esto le ahorra a la
    // interfaz tener que deducir la regla, y si mañana cambia, cambia en un solo sitio.
    campos_solo_lectura: usuario ? [...CAMPOS_DE_LA_CUENTA] : [],
  };
};

/**
 * Obtiene todos los conductores con sus catálogos relacionados.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const rows = await Conductor.findAll({ include: includeCatalogos, order: [['nombre_apellidos', 'ASC']] });
  return rows.map(mapConductor);
};

/**
 * Busca un conductor por su ID.
 * @param {number} id
 * @param {import('sequelize').Transaction} [opciones.transaction] - Pasarla cuando se
 *   llama justo después de un create en la misma transacción: si no, esta lectura sale
 *   por otra conexión del pool y no ve la fila todavía sin confirmar (queda en null).
 * @returns {Promise<Object|null>}
 */
const findById = async (id, { transaction } = {}) => {
  const row = await Conductor.findByPk(id, { include: includeCatalogos, transaction });
  return mapConductor(row);
};

/**
 * Busca un conductor por su documento (tipo + número, clave compuesta única).
 * @param {string} tipoDocumento
 * @param {string} numeroDocumento
 * @returns {Promise<Object|null>}
 */
const findByDocumento = async (tipoDocumento, numeroDocumento) => {
  const row = await Conductor.findOne({
    where: { tipo_documento: tipoDocumento, numero_documento: numeroDocumento },
    include: includeCatalogos,
  });
  return mapConductor(row);
};

/**
 * Busca conductores por correo electrónico.
 * @param {string} correo
 * @returns {Promise<Array>}
 */
const findByCorreo = async (correo) => {
  const rows = await Conductor.findAll({ where: { correo }, include: includeCatalogos });
  return rows.map(mapConductor);
};

/**
 * Busca el conductor asociado a una cuenta de usuario (1:1).
 * @param {number} usuarioId
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<Object|null>}
 */
const findByUsuarioId = async (usuarioId, { transaction } = {}) => {
  const row = await Conductor.findOne({ where: { usuario_id: usuarioId }, include: includeCatalogos, transaction });
  return mapConductor(row);
};

/**
 * Obtiene conductores activos (estado = true).
 * @returns {Promise<Array>}
 */
const findActivos = async () => {
  const rows = await Conductor.findAll({ where: { estado: true }, include: includeCatalogos, order: [['nombre_apellidos', 'ASC']] });
  return rows.map(mapConductor);
};

/**
 * Crea un nuevo conductor.
 * @param {Object} data
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<Object>} Conductor creado con catálogos.
 */
const create = async (data, { transaction } = {}) => {
  const {
    usuario_id, tipo_documento, numero_documento, nombre_apellidos, correo,
    direccion, numero_telefonico, tipo_usuario_id, regional_formacion,
    centro_formacion, programa_formacion, vigencia, movilidad_reducida = false,
    tipo_discapacidad, estado = true,
  } = data;

  const nuevo = await Conductor.create({
    usuario_id: usuario_id || null,
    tipo_documento,
    numero_documento,
    nombre_apellidos,
    correo: correo || null,
    direccion: direccion || null,
    numero_telefonico: numero_telefonico || null,
    tipo_usuario_id: tipo_usuario_id || null,
    regional_formacion: regional_formacion || null,
    centro_formacion: centro_formacion || null,
    programa_formacion: programa_formacion || null,
    vigencia: vigencia || null,
    movilidad_reducida,
    tipo_discapacidad: tipo_discapacidad || null,
    estado,
  }, { transaction });
  return findById(nuevo.id, { transaction });
};

/**
 * Actualiza parcialmente un conductor.
 * @param {number} id
 * @param {Object} data - Campos a actualizar (todos opcionales).
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<Object>} Conductor actualizado.
 */
const update = async (id, data, { transaction } = {}) => {
  const allowedFields = [
    'usuario_id', 'tipo_documento', 'numero_documento', 'nombre_apellidos', 'correo',
    'direccion', 'numero_telefonico', 'tipo_usuario_id', 'regional_formacion',
    'centro_formacion', 'programa_formacion', 'vigencia', 'movilidad_reducida',
    'tipo_discapacidad', 'estado',
  ];
  const cambios = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) cambios[field] = data[field];
  }

  if (Object.keys(cambios).length === 0) {
    return findById(id, { transaction });
  }

  await Conductor.update(cambios, { where: { id }, transaction });
  return findById(id, { transaction });
};

/**
 * Elimina un conductor (borrado físico).
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const filasEliminadas = await Conductor.destroy({ where: { id } });
  return filasEliminadas > 0;
};

module.exports = {
  findAll,
  findById,
  findByDocumento,
  findByCorreo,
  findByUsuarioId,
  findActivos,
  create,
  update,
  remove,
  CAMPOS_DE_LA_CUENTA,
};
