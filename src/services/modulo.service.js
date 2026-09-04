/**
 * @module ModuloService
 * @description Lectura del catálogo 'modulo', que agrupa los permisos del sistema
 * (Configuración, Usuarios, Parqueaderos, Control de Ingreso...).
 *
 * El catálogo existía en la base de datos y tenía modelo y repositorio, pero no estaba
 * expuesto por ninguna ruta: la pantalla de crear/editar rol pedía los módulos para dibujar
 * sus secciones, recibía un 404 y por eso no mostraba ningún módulo ni ninguna casilla de
 * permiso. Es un catálogo de solo lectura -- los módulos y permisos son parte del diseño
 * del sistema, no datos que el administrador dé de alta.
 */

const repo = require('../repositories/modulo.repository');

/**
 * Lista los módulos.
 * @param {Object} [opciones]
 * @param {boolean} [opciones.conPermisos=false] - Anida los permisos de cada módulo.
 * @returns {Promise<Array>}
 */
const getAll = ({ conPermisos = false } = {}) => (
  conPermisos ? repo.findAllConPermisos() : repo.findAll()
);

/**
 * Busca un módulo por su ID.
 * @param {number} id
 * @throws {Object} 404 si no existe.
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Módulo no encontrado' };
  return item;
};

module.exports = { getAll, getById };
