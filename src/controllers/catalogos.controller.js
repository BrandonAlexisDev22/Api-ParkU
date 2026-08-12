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

module.exports = {
  getTiposUsuario,
};
