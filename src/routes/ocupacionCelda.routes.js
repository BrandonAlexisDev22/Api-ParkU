const router = require('express').Router();
const ctrl = require('../controllers/ocupacionCelda.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Ocupacion
 *   description: Quién ocupa (o ocupó) cada celda, ahora e histórico
 */

router.get('/',
  verificarToken,
  verificarRol([1, 2]), // Admin (1) o Vigilante (2)
  ctrl.getAll
);

router.get('/celda/:celdaId',
  verificarToken,
  ctrl.getByCelda
);

router.get('/vehiculo/:vehiculoId',
  verificarToken,
  ctrl.getByVehiculo
);

router.get('/:id',
  verificarToken,
  verificarRol([1, 2]), // Admin (1) o Vigilante (2)
  ctrl.getById
);

module.exports = router;
