/**
 * @swagger
 * tags:
 *   name: Catalogos
 *   description: Catálogos de referencia (solo lectura) para el módulo de conductores
 */

const svc = require('../services/catalogos.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * /api/catalogos/tipos-usuario:
 *   get:
 *     summary: Listar los tipos de usuario disponibles
 *     tags: [Catalogos]
 *     responses:
 *       200:
 *         description: Lista de tipos de usuario
 */
const getTiposUsuario = async (req, res) => {
  try {
    res.json(await svc.getTiposUsuario());
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /api/catalogos/regionales-formacion:
 *   get:
 *     summary: Listar las regionales de formación disponibles
 *     tags: [Catalogos]
 *     responses:
 *       200:
 *         description: Lista de regionales de formación
 */
const getRegionalesFormacion = async (req, res) => {
  try {
    res.json(await svc.getRegionalesFormacion());
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /api/catalogos/centros-formacion:
 *   get:
 *     summary: Listar los centros de formación disponibles
 *     tags: [Catalogos]
 *     parameters:
 *       - in: query
 *         name: regional_formacion_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtra los centros por regional de formación
 *     responses:
 *       200:
 *         description: Lista de centros de formación
 */
const getCentrosFormacion = async (req, res) => {
  try {
    const { regional_formacion_id } = req.query;
    res.json(await svc.getCentrosFormacion(regional_formacion_id));
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /api/catalogos/programas-formacion:
 *   get:
 *     summary: Listar los programas de formación disponibles
 *     tags: [Catalogos]
 *     responses:
 *       200:
 *         description: Lista de programas de formación
 */
const getProgramasFormacion = async (req, res) => {
  try {
    res.json(await svc.getProgramasFormacion());
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = {
  getTiposUsuario,
  getRegionalesFormacion,
  getCentrosFormacion,
  getProgramasFormacion,
};
