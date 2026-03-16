const router = require('express').Router();
const ctrl   = require('../controllers/reserva.controller');

router.get('/',                      ctrl.getAll);
router.get('/vehiculo/:vehiculoId',  ctrl.getByVehiculo);
router.get('/celda/:celdaId',        ctrl.getByCelda);
router.get('/:id',                   ctrl.getById);
router.post('/',                     ctrl.create);
router.put('/:id',                   ctrl.update);
router.delete('/:id',                ctrl.remove);

module.exports = router;
