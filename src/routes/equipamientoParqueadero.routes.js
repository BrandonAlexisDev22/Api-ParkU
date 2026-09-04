const router = require('express').Router();
const ctrl = require('../controllers/equipamientoParqueadero.controller');
const { verificarToken, verificarAcceso } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Parqueaderos
 *   description: Equipamiento (edición/borrado directo por ID)
 */

router.put('/:id',
  verificarToken,
  verificarAcceso({ permisos: ['parqueaderos.gestionar'], roles: [1] }), // o quien tenga el permiso
  ctrl.update
);

router.delete('/:id',
  verificarToken,
  verificarAcceso({ permisos: ['parqueaderos.gestionar'], roles: [1] }), // o quien tenga el permiso
  ctrl.remove
);

module.exports = router;
