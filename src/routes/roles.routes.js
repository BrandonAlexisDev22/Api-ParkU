const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roles.controller');

router.post('/create', roleController.createRole);
router.put('/edit/:id', roleController.editRole);
router.delete('/delete/:id', roleController.deleteRole)
router.get('/get', roleController.getRoles);

module.exports = router;