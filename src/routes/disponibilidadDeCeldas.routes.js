const express = require("express");
const router = express.Router();

const disponibilidadController = require("../controllers/disponibilidadCeldaController");

/**
 * Listar disponibilidades
 */
router.get("/listar", disponibilidadController.listar);

/**
 * Consultar disponibilidad por ID
 */
router.get("/consultar/:id", disponibilidadController.consultar);

/**
 * Visualizar disponibilidad
 */
router.get("/visualizar/:id", disponibilidadController.visualizar);

/**
 * Editar disponibilidad
 */
router.put("/editar/:id", disponibilidadController.editar);

module.exports = router;