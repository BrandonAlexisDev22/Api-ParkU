/**
 * @module ModuloRepository
 * @description Operaciones de base de datos para el catálogo 'modulo'.
 */

const { Modulo, Permiso } = require('../models');

const findAll = async () => {
  const rows = await Modulo.findAll({ order: [['nombre', 'ASC']] });
  return rows.map((r) => r.toJSON());
};

/**
 * Módulos con los permisos que cuelgan de cada uno: el árbol
 * módulo -> permisos que necesita la pantalla de crear/editar rol para dibujar sus
 * secciones con casillas, en una sola petición.
 *
 * Se ordena por id de módulo (Configuración, Usuarios, Parqueaderos, Control de Ingreso...)
 * porque ese orden refleja el dominio; el alfabético dejaría "Control de Salida" antes que
 * "Configuración" y la pantalla quedaría desordenada sin motivo.
 * @returns {Promise<Array>}
 */
const findAllConPermisos = async () => {
  const rows = await Modulo.findAll({
    include: [{ model: Permiso, as: 'permisos', attributes: ['id', 'nombre', 'descripcion'] }],
    order: [['id', 'ASC'], [{ model: Permiso, as: 'permisos' }, 'nombre', 'ASC']],
  });
  return rows.map((r) => r.toJSON());
};

const findById = async (id) => {
  const row = await Modulo.findByPk(id);
  return row ? row.toJSON() : null;
};

const findByNombre = async (nombre) => {
  const row = await Modulo.findOne({ where: { nombre } });
  return row ? row.toJSON() : null;
};

module.exports = { findAll, findAllConPermisos, findById, findByNombre };
