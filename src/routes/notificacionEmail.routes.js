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

// Diagnóstico de por qué no llegan los correos, sin acceso a las variables ni a los logs del
// servidor (ver mailer.util.js diagnosticoCorreo). Solo Administrador: revela el remitente y
// el host SMTP, aunque nunca claves ni contraseñas.
router.get(
  "/diagnostico",
  verificarToken,
  verificarRol(ROLES.ADMIN),
  ctrl.diagnostico,
);

// Envía un correo de prueba al propio administrador y devuelve el motivo exacto si falla.
router.post(
  "/prueba",
  verificarToken,
  verificarRol(ROLES.ADMIN),
  ctrl.prueba,
);

module.exports = router;
