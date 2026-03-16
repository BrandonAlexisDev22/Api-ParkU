const router = require('express').Router();
const ctrl   = require('../controllers/celda.controller');

router.get('/',                                    ctrl.getAll);
router.get('/parqueadero/:parqueaderoId',           ctrl.getByParqueadero);
router.get('/parqueadero/:parqueaderoId/disponibles', ctrl.getDisponibles);
router.get('/:id',                                 ctrl.getById);
router.post('/',                                   ctrl.create);
router.put('/:id',                                 ctrl.update);
router.delete('/:id',                              ctrl.remove);

module.exports = router;
