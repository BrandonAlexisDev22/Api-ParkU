const router = require('express').Router();
const ctrl = require('../controllers/catalogos.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

router.get('/tipos-usuario', verificarToken, ctrl.getTiposUsuario);

module.exports = router;
