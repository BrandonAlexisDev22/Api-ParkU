const router = require('express').Router();
const ctrl = require('../controllers/evidenciaNovedad.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Novedades
 *   description: Evidencias (borrado directo por ID)
 */

router.delete('/:id',
  verificarToken,
  verificarRol([1, 2]), // Admin (1) o Vigilante (2)
  ctrl.remove
);

module.exports = router;
