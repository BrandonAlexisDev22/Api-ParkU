/**
 * @module ModuloController
 * @description Catálogo de módulos del sistema (solo lectura). Es lo que consume la
 * pantalla de crear/editar rol para agrupar los permisos por sección.
 */

const svc = require('../services/modulo.service');
const { handleError } = require('../helpers/errorHandler');

const getAll = async (req, res) => {
  try {
    // ?con_permisos=true devuelve cada módulo con sus permisos anidados, que es el árbol
    // que necesita el formulario de roles en una sola petición.
    const conPermisos = ['true', '1', 'si', 'sí'].includes(String(req.query.con_permisos || '').toLowerCase());
    const data = await svc.getAll({ conPermisos });
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

const getById = async (req, res) => {
  try {
    const data = await svc.getById(req.params.id);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = { getAll, getById };
