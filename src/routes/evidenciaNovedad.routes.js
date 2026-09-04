const router = require('express').Router();
const ctrl = require('../controllers/evidenciaNovedad.controller');
const { verificarToken, verificarAcceso } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Novedades
 *   description: Evidencias (borrado directo por ID)
 */

router.delete('/:id',
  verificarToken,
  verificarAcceso({ permisos: ['novedades.gestionar'], roles: [1,2] }), // o quien tenga el permiso
  ctrl.remove
);

module.exports = router;
