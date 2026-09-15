/**
 * @module NotificacionCorreoController
 * @description Controlador para enviar correos a usuarios usando Resend.
 */

const svc = require("../services/notificacionCorreo.service");
const { handleError } = require("../helpers/errorHandler");

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

module.exports = { enviarCorreoMasivo };
