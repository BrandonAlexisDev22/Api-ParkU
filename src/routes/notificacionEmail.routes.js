const router = require("express").Router();
const ctrl = require("../controllers/notificacionCorreo.controller");
const {
  verificarToken,
  verificarRol,
} = require("../middlewares/auth.middleware");
const { ROLES } = require("../config/roles");

router.post(
  "/",
  verificarToken,
  verificarRol(ROLES.ADMIN),
  ctrl.enviarCorreoMasivo,
);

module.exports = router;
