/**
 * @module NotificacionCorreoService
 * @description Envío de correos a usuarios con Resend.
 */

const { Usuario } = require("../models");
const { sendEmail } = require("../utils/resend.util");

const _stripHtml = (value) => {
  if (!value) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const _resolverDestinatarios = async ({
  usuarioId,
  email,
  emails,
  destinos,
}) => {
  const lista = [];

  if (usuarioId) {
    const usuario = await Usuario.findByPk(Number(usuarioId), {
      attributes: ["correo"],
      raw: true,
    });

    if (usuario?.correo) lista.push(usuario.correo);
  }

  if (email) lista.push(email);

  if (Array.isArray(emails)) lista.push(...emails);
  if (Array.isArray(destinos)) lista.push(...destinos);

  const normalizados = [
    ...new Set(
      lista
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean),
    ),
  ];

  if (!normalizados.length) {
    throw {
      status: 400,
      message:
        "No se encontró ningún correo válido para enviar la notificación",
    };
  }

  return normalizados;
};

const enviarCorreo = async ({
  usuarioId,
  email,
  emails,
  destinos,
  asunto,
  html,
  text,
  from,
  replyTo,
}) => {
  if (!asunto || !String(asunto).trim()) {
    throw { status: 400, message: "El asunto del correo es obligatorio" };
  }

  if (!html && !text) {
    throw { status: 400, message: "Debe incluir html o text en el mensaje" };
  }

  const destinatarios = await _resolverDestinatarios({
    usuarioId,
    email,
    emails,
    destinos,
  });
  const cuerpoHtml =
    html ||
    `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${(text || "").replace(/\n/g, "<br>")}</div>`;
  const textoPlano = text || _stripHtml(cuerpoHtml);

  const resultado = await sendEmail({
    to: destinatarios,
    subject: asunto,
    html: cuerpoHtml,
    text: textoPlano,
    from,
    replyTo,
  });

  if (!resultado.ok) {
    throw {
      status: 502,
      message: resultado.motivo || "No se pudo enviar el correo con Resend",
    };
  }

  return {
    ok: true,
    enviados: destinatarios.length,
    destinatarios,
    id: resultado.id || null,
  };
};

module.exports = { enviarCorreo };
