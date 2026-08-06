/**
 * @module ConductorRepository
 * @description Operaciones de base de datos para la tabla 'conductor' usando Sequelize.
 * Incluye los nombres de las tablas de catálogo relacionadas (tipo de usuario,
 * regional/centro/programa de formación) mediante JOIN.
 */

const { Conductor, TipoUsuario, RegionalFormacion, CentroFormacion, ProgramaFormacion, Usuario } = require('../models');

const includeCatalogos = [
  { model: TipoUsuario, as: 'tipoUsuario', attributes: ['tipo_usuario'] },
  { model: RegionalFormacion, as: 'regionalFormacion', attributes: ['nombre'] },
  { model: CentroFormacion, as: 'centroFormacion', attributes: ['nombre'] },
  { model: ProgramaFormacion, as: 'programaFormacion', attributes: ['nombre'] },
  { model: Usuario, as: 'usuario', attributes: ['id', 'correo', 'nombre'] },
];

/**
 * Aplana el resultado de Sequelize para exponer los nombres de catálogo
 * como campos planos de solo lectura (tipo_usuario_nombre, etc.).
 * @param {import('sequelize').Model} instancia
 * @returns {Object|null}
 */
const mapConductor = (instancia) => {
  if (!instancia) return null;
  const plano = instancia.toJSON();
  const { tipoUsuario, regionalFormacion, centroFormacion, programaFormacion, usuario, ...resto } = plano;
  return {
    ...resto,
    tipo_usuario_nombre: tipoUsuario ? tipoUsuario.tipo_usuario : null,
    regional_formacion_nombre: regionalFormacion ? regionalFormacion.nombre : null,
    centro_formacion_nombre: centroFormacion ? centroFormacion.nombre : null,
    programa_formacion_nombre: programaFormacion ? programaFormacion.nombre : null,
    usuario_correo: usuario ? usuario.correo : null,
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
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const row = await Conductor.findByPk(id, { include: includeCatalogos });
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
 * @returns {Promise<Object>} Conductor creado con catálogos.
 */
const create = async (data) => {
  const {
    usuario_id, tipo_documento, numero_documento, nombre_apellidos, correo,
    direccion, numero_telefonico, tipo_usuario_id, regional_formacion_id,
    centro_formacion_id, programa_formacion_id, vigencia, estado = true,
  } = data;

  const nuevo = await Conductor.create({
    usuario_id: usuario_id || null,
    tipo_documento,
    numero_documento,
    nombre_apellidos,
    correo: correo || null,
    direccion,
    numero_telefonico: numero_telefonico || null,
    tipo_usuario_id,
    regional_formacion_id,
    centro_formacion_id,
    programa_formacion_id,
    vigencia,
    estado,
  });
  return findById(nuevo.id);
};

/**
 * Actualiza parcialmente un conductor.
 * @param {number} id
 * @param {Object} data - Campos a actualizar (todos opcionales).
 * @returns {Promise<Object>} Conductor actualizado.
 */
const update = async (id, data) => {
  const allowedFields = [
    'usuario_id', 'tipo_documento', 'numero_documento', 'nombre_apellidos', 'correo',
    'direccion', 'numero_telefonico', 'tipo_usuario_id', 'regional_formacion_id',
    'centro_formacion_id', 'programa_formacion_id', 'vigencia', 'estado',
  ];
  const cambios = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) cambios[field] = data[field];
  }

  if (Object.keys(cambios).length === 0) {
    return findById(id);
  }

  await Conductor.update(cambios, { where: { id } });
  return findById(id);
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
  findActivos,
  create,
  update,
  remove,
};
