const router = require('express').Router();
const ctrl   = require('../controllers/usuario.controller');

router.post('/login',              ctrl.login);
router.get('/',                    ctrl.getAll);
router.get('/:id',                 ctrl.getById);
router.post('/',                   ctrl.create);
router.put('/:id',                 ctrl.update);
router.patch('/:id/contrasena',    ctrl.cambiarContrasena);
router.delete('/:id',              ctrl.remove);

module.exports = router;
