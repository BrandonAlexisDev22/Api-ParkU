const router = require('express').Router();
const ctrl = require('../controllers/auditoria.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Auditoria
 *   description: Rastro de auditoría de la BD (solo administradores)
 */

router.get('/',
  verificarToken,
  verificarRol([1]), // Solo Admin (1)
  ctrl.getAll
);

router.get('/:id',
  verificarToken,
  verificarRol([1]), // Solo Admin (1)
  ctrl.getById
);

module.exports = router;
