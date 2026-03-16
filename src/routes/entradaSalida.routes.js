const router = require('express').Router();
const ctrl   = require('../controllers/entradaSalida.controller');

router.get('/',                        ctrl.getAll);
router.get('/filtro',                  ctrl.getByFecha);      // ?desde=&hasta=
router.get('/vehiculo/:vehiculoId',    ctrl.getByVehiculo);
router.get('/:id',                     ctrl.getById);
router.post('/entrada',                ctrl.registrarEntrada);
router.post('/salida',                 ctrl.registrarSalida);
router.delete('/:id',                  ctrl.remove);

module.exports = router;
