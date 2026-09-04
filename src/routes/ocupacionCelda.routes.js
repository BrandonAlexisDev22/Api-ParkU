const router = require('express').Router();
const ctrl = require('../controllers/ocupacionCelda.controller');
const { verificarToken, verificarAcceso } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Ocupacion
 *   description: Quién ocupa (o ocupó) cada celda, ahora e histórico
 */

router.get('/',
  verificarToken,
  verificarAcceso({ permisos: ['parqueaderos.consultar'], roles: [1,2] }), // o quien tenga el permiso
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
  verificarAcceso({ permisos: ['parqueaderos.consultar'], roles: [1,2] }), // o quien tenga el permiso
  ctrl.getById
);

module.exports = router;
