const express = require("express");
const router = express.Router();
const celdasController = require("../controllers/celdas.controller");

// Rutas para la gestión de celdas
router.post("/create", celdasController.createCelda);
router.put("/edit/:id", celdasController.editCelda);
router.delete("/delete/:id", celdasController.deleteCelda);
router.get("/get", celdasController.getCeldas);

module.exports = router;
