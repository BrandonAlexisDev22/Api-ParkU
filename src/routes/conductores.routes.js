const express = require('express');
const router = express.Router();
const conductoresController = require('../controllers/conductores.controller');

router.post('/create', conductoresController.createConductor);
router.put('/edit/:id', conductoresController.editConductor);
router.delete('/delete/:id', conductoresController.deleteConductor)
router.get('/get', conductoresController.getConductores);

module.exports = router