const router = require('express').Router();
const ctrl   = require('../controllers/rolPermiso.controller');

router.get('/',           ctrl.getAll);
router.get('/rol/:rolId', ctrl.getByRol);
router.post('/',          ctrl.create);
router.delete('/:id',     ctrl.remove);

module.exports = router;
