const router = require('express').Router();
const ctrl = require('../controllers/equipamientoParqueadero.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Parqueaderos
 *   description: Equipamiento (edición/borrado directo por ID)
 */

router.put('/:id',
  verificarToken,
  verificarRol([1]), // Solo Admin (1)
  ctrl.update
);

router.delete('/:id',
  verificarToken,
  verificarRol([1]), // Solo Admin (1)
  ctrl.remove
);

module.exports = router;
