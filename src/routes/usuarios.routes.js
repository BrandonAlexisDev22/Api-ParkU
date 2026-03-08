const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarios.controller');

router.post('/create', usuarioController.createUsuario);
router.put('/edit/:id', usuarioController.editUsuario);
router.delete('/delete/:id', usuarioController.deleteUsuario);
router.get('/get', usuarioController.getUsuarios);

module.exports = router;