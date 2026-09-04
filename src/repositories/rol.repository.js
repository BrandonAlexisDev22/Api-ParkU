/**
 * @module RolRepository
 * @description Operaciones de base de datos para la tabla 'rol' usando Sequelize.
 * Incluye los permisos asociados a través de la tabla intermedia rol_permiso.
 */

const { Rol, Permiso, Modulo } = require('../models');

const includePermisos = {
  model: Permiso,
  as: 'permisos',
  // Se incluye modulo_id y el módulo completo para que la pantalla de crear/editar rol
  // pueda pintar los permisos agrupados por módulo con SOLO esta respuesta, sin tener que
  // cruzarla contra GET /api/permisos. Antes llegaban como {id, nombre} pelados: si la UI
  // agrupaba por módulo, no encontraba por dónde agrupar y no mostraba ninguno.
  attributes: ['id', 'nombre', 'modulo_id'],
  through: { attributes: [] }, // oculta los campos de la tabla intermedia
  include: [{ model: Modulo, as: 'modulo', attributes: ['id', 'nombre'] }],
};

/**
 * Aplana un rol y añade `permiso_ids`: el arreglo plano de identificadores, que es
 * justamente lo que necesita marcar casillas en un formulario y lo que hay que devolver en
 * PUT /api/roles/:id/permisos. Se ordenan por módulo y nombre para que la lista salga
 * siempre igual y agrupada.
 * @param {import('sequelize').Model} instancia
 * @returns {Object|null}
 */
const mapRol = (instancia) => {
  if (!instancia) return null;
  const plano = instancia.toJSON();
  const permisos = (plano.permisos || []).sort(
    (a, b) => (a.modulo_id - b.modulo_id) || a.nombre.localeCompare(b.nombre),
  );
  return { ...plano, permisos, permiso_ids: permisos.map((p) => p.id) };
};

/**
 * Recupera todos los roles con sus permisos.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const rows = await Rol.findAll({ include: [includePermisos], order: [['id', 'ASC']] });
  return rows.map(mapRol);
};

/**
 * Busca un rol por su identificador, con sus permisos.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const row = await Rol.findByPk(id, { include: [includePermisos] });
  return mapRol(row);
};

/**
 * Crea un nuevo rol.
 * @param {Object} data
 * @param {string} data.nombre
 * @returns {Promise<Object>}
 */
const create = async ({ nombre, descripcion, estado = true }) => {
  const nuevo = await Rol.create({ nombre, descripcion, estado });
  return findById(nuevo.id);
};

/**
 * Actualiza un rol existente.
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const update = async (id, data) => {
  const cambios = {};
  for (const field of ['nombre', 'descripcion', 'estado']) {
    if (data[field] !== undefined) cambios[field] = data[field];
  }
  if (Object.keys(cambios).length === 0) {
    return findById(id);
  }
  await Rol.update(cambios, { where: { id } });
  return findById(id);
};

/**
 * Elimina un rol.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const filasEliminadas = await Rol.destroy({ where: { id } });
  return filasEliminadas > 0;
};

/**
 * Asigna un permiso a un rol (crea el registro en rol_permiso).
 * @param {number} rolId
 * @param {number} permisoId
 * @returns {Promise<void>}
 */
const asignarPermiso = async (rolId, permisoId) => {
  const rol = await Rol.findByPk(rolId);
  if (!rol) throw { status: 404, message: 'Rol no encontrado' };
  await rol.addPermiso(permisoId); // método mágico que da belongsToMany
};

/**
 * Quita un permiso de un rol (elimina el registro en rol_permiso).
 * @param {number} rolId
 * @param {number} permisoId
 * @returns {Promise<void>}
 */
const quitarPermiso = async (rolId, permisoId) => {
  const rol = await Rol.findByPk(rolId);
  if (!rol) throw { status: 404, message: 'Rol no encontrado' };
  await rol.removePermiso(permisoId);
};

/**
 * Deja el rol EXACTAMENTE con los permisos indicados: asigna los que falten y quita los
 * que sobren, en una sola operación. Es lo que necesita una pantalla de "editar rol" con
 * casillas de verificación, donde el cliente manda el conjunto completo y no una lista de
 * altas y bajas.
 *
 * setPermisos es el método que genera belongsToMany; resuelve el diff solo, así que no hay
 * que borrar todo y reinsertar (eso perdería fecha_asignacion de los permisos que se
 * mantienen).
 * @param {number} rolId
 * @param {number[]} permisoIds
 * @returns {Promise<Object>} El rol con sus permisos ya actualizados.
 */
const reemplazarPermisos = async (rolId, permisoIds) => {
  const rol = await Rol.findByPk(rolId);
  if (!rol) throw { status: 404, message: 'Rol no encontrado' };
  await rol.setPermisos(permisoIds);
  return findById(rolId);
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  asignarPermiso,
  quitarPermiso,
  reemplazarPermisos,
};