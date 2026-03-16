const router = require('express').Router();
const ctrl   = require('../controllers/vehiculo.controller');

router.get('/',                          ctrl.getAll);
router.get('/conductor/:conductorId',    ctrl.getByConductor);
router.get('/:id',                       ctrl.getById);
router.post('/',                         ctrl.create);
router.put('/:id',                       ctrl.update);
router.delete('/:id',                    ctrl.remove);

module.exports = router;
