const router = require('express').Router();
const ctrl = require('../controllers/auditoria.controller');
const { verificarToken, verificarAcceso } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Auditoria
 *   description: Rastro de auditoría de la BD (solo administradores)
 */

router.get('/',
  verificarToken,
  verificarAcceso({ permisos: ['reportes.consultar'], roles: [1] }), // o quien tenga el permiso
  ctrl.getAll
);

router.get('/:id',
  verificarToken,
  verificarAcceso({ permisos: ['reportes.consultar'], roles: [1] }), // o quien tenga el permiso
  ctrl.getById
);

module.exports = router;
