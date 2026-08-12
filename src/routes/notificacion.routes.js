const router = require('express').Router();
const ctrl = require('../controllers/notificacion.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Notificaciones
 *   description: Notificaciones del usuario autenticado
 */

router.get('/',
  verificarToken,
  ctrl.getMisNotificaciones
);

router.patch('/leer-todas',
  verificarToken,
  ctrl.marcarTodasLeidas
);

router.patch('/:id/leida',
  verificarToken,
  ctrl.marcarLeida
);

module.exports = router;
