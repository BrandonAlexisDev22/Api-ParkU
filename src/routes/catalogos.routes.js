const router = require('express').Router();
const ctrl = require('../controllers/catalogos.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

router.get('/tipos-usuario', verificarToken, ctrl.getTiposUsuario);
router.get('/regionales-formacion', verificarToken, ctrl.getRegionalesFormacion);
router.get('/centros-formacion', verificarToken, ctrl.getCentrosFormacion);
router.get('/programas-formacion', verificarToken, ctrl.getProgramasFormacion);

module.exports = router;
