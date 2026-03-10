const express = require('express');
const router = express.Router();
const parqueaderoController = require('../controllers/parqueaderos.controller');

router.post('/create', parqueaderoController.createParqueadero);
router.put('/edit/:id', parqueaderoController.editParqueadero);
router.delete('/delete/:id', parqueaderoController.deleteParqueadero);
router.get('/get', parqueaderoController.getParqueaderos);
router.get('/get/:id', parqueaderoController.getParqueaderoById);

module.exports = router;