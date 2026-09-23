/**
 * @module NotificacionCorreoController
 * @description Controlador para enviar correos a usuarios usando Resend.
 */

const svc = require("../services/notificacionCorreo.service");
const { handleError } = require("../helpers/errorHandler");
const correos = require("../utils/mailer.util");

const enviarCorreoMasivo = async (req, res) => {
  try {
    const {
      usuarioId,
      email,
      emails,
      destinos,
      asunto,
      html,
      text,
      from,
      replyTo,
    } = req.body || {};

    const data = await svc.enviarCorreo({
      usuarioId,
      email,
      emails,
      destinos,
      asunto,
      html,
      text,
      from,
      replyTo,
    });

    res.status(200).json({
      success: true,
      message: "Correo enviado correctamente",
      data,
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * GET /api/notificaciones/email/diagnostico — qué proveedor de correo está configurado, con
 * qué remitente y qué advertencias hay. Sin claves ni contraseñas.
 */
const diagnostico = (req, res) => {
  res.status(200).json({ success: true, data: correos.diagnosticoCorreo() });
};

/**
 * POST /api/notificaciones/email/prueba — manda un correo de prueba al propio administrador
 * que lo pide, por el MISMO camino que los correos reales (enviarCorreo: Resend y, si falla,
 * SMTP). Devuelve si salió y, si no, el motivo exacto que dio el proveedor.
 */
const prueba = async (req, res) => {
  try {
    const destino = req.usuario?.correo;
    if (!destino) {
      return res.status(400).json({ success: false, message: "Tu cuenta no tiene correo al que enviar la prueba" });
    }
    const resultado = await correos.enviarCorreo({
      destino,
      asunto: "Correo de prueba — ParkU",
      html: "<p>Si ves este correo, el envío de correos de ParkU funciona.</p>",
      texto: "Si ves este correo, el envío de correos de ParkU funciona.",
    });
    return res.status(200).json({
      success: resultado.enviado,
      message: resultado.enviado
        ? `Correo de prueba enviado a ${destino}. Revisa tu bandeja (y spam).`
        : `No se pudo enviar el correo de prueba: ${resultado.motivo}`,
      data: { destino, ...resultado, diagnostico: correos.diagnosticoCorreo() },
    });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { enviarCorreoMasivo, diagnostico, prueba };
