const router = require('express').Router();
const ctrl = require('../controllers/asignacionVigilante.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: AsignacionVigilante
 *   description: Turnos y parqueaderos asignados a cada vigilante
 */

router.get('/',
  verificarToken,
  verificarRol([1]), // Solo Admin (1)
  ctrl.getAll
);

router.get('/usuario/:usuarioId',
  verificarToken,
  ctrl.getByUsuario
);

router.get('/:id',
  verificarToken,
  verificarRol([1]), // Solo Admin (1)
  ctrl.getById
);

router.post('/',
  verificarToken,
  verificarRol([1]), // Solo Admin (1)
  ctrl.create
);

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
