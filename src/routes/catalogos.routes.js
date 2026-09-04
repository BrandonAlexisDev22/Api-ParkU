const router = require('express').Router();
const ctrl = require('../controllers/catalogos.controller');

/**
 * @swagger
 * /api/catalogos/tipos-usuario:
 *   get:
 *     summary: Tipos de usuario del SENA (Aprendiz, Instructor, Administrativo…)
 *     description: >
 *       Público: lo necesita el formulario de registro, donde todavía no hay sesión. Es un
 *       catálogo cerrado de tres filas sin ningún dato personal, así que exigir token solo
 *       servía para que el registro no pudiera preguntar el perfil de quien se inscribe.
 *     tags: [Catálogos]
 *     responses:
 *       200:
 *         description: Lista de tipos de usuario
 */
router.get('/tipos-usuario', ctrl.getTiposUsuario);

module.exports = router;
