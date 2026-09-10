/**
 * @module ResendUtil
 * @description Envío de correos con Resend y fallback a logger si no hay API key.
 */

const { Resend } = require("resend");
const Logger = require("./logger.util");

let resendClient = null;

const getClient = () => {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();

  if (!apiKey) {
    Logger.warn(
      "RESEND_API_KEY no configurada; los correos con Resend quedan deshabilitados.",
    );
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
};

const getDefaultFrom = () => {
  const from = (process.env.RESEND_FROM || process.env.MAIL_FROM || "").trim();
  if (from) return from;

  const domain = (process.env.RESEND_DOMAIN || "").trim();
  if (domain) return `ParkU <noreply@${domain}>`;

  return "ParkU <onboarding@resend.dev>";
};

const sendEmail = async ({ to, subject, html, text, from, replyTo }) => {
  const client = getClient();
  if (!client) {
    return {
      ok: false,
      motivo: "RESEND_API_KEY no configurada",
      enviado: false,
    };
  }

  const recipients = Array.isArray(to) ? to : [to];
  const destinatarios = recipients
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  if (!destinatarios.length) {
    throw { status: 400, message: "Debe indicar al menos un destinatario" };
  }

  const payload = {
    from: from || getDefaultFrom(),
    to: destinatarios,
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
    ...(replyTo ? { reply_to: replyTo } : {}),
  };

  try {
    const response = await client.emails.send(payload);

    if (response.error) {
      const motivo = response.error.message || "No se pudo enviar el correo";
      Logger.error("Resend respondió con error", {
        motivo,
        payload: { to: destinatarios, subject },
      });
      return { ok: false, enviado: false, motivo };
    }

    return {
      ok: true,
      enviado: true,
      id: response.data?.id || null,
      data: response.data || null,
    };
  } catch (error) {
    Logger.error("Error enviando correo con Resend", {
      destino: destinatarios,
      asunto: subject,
      error: error.message,
    });

    return {
      ok: false,
      enviado: false,
      motivo: error.message || "Error al enviar el correo",
    };
  }
};

module.exports = { getClient, getDefaultFrom, sendEmail };
