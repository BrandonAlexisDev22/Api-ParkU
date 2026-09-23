/**
 * @module BrevoUtil
 * @description Envío de correos con la API HTTP de Brevo (antes Sendinblue).
 *
 * Existe porque el SMTP de Brevo (smtp-relay.brevo.com / smtp-relay.sendinblue.com) no sirve
 * desde Render: el plan gratuito bloquea las conexiones salientes a los puertos SMTP
 * (25/465/587) y cada envío terminaba en "Connection timeout". La API va por HTTPS (443),
 * que no está bloqueado, y usa la misma cuenta de Brevo.
 *
 * Necesita una API key de Brevo (Brevo → SMTP & API → API Keys, empieza por "xkeysib-"). No
 * es la misma que la clave SMTP ("xsmtpsib-"), que no sirve aquí.
 */

const Logger = require("./logger.util");

const URL_API = "https://api.brevo.com/v3/smtp/email";
const TIMEOUT_MS = 15000;

/**
 * "Nombre <correo@dominio>" o "correo@dominio" -> { name, email }. null si no hay correo.
 * @param {string} remitente
 */
const parsearRemitente = (remitente) => {
  const texto = String(remitente || "").trim();
  if (!texto) return null;
  const m = texto.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim() || "ParkU", email: m[2].trim() };
  return texto.includes("@") ? { name: "ParkU", email: texto } : null;
};

/**
 * El remitente que se usa con Brevo: BREVO_FROM o, si no, MAIL_FROM. Tiene que ser un correo
 * verificado como remitente en Brevo (Senders, Domains & Dedicated IPs → Senders).
 */
const remitenteBrevo = () => process.env.BREVO_FROM || process.env.MAIL_FROM || "";

/**
 * @param {Object} datos
 * @param {string} datos.to
 * @param {string} datos.subject
 * @param {string} datos.html
 * @param {string} [datos.text]
 * @returns {Promise<{ok: boolean, id?: string, motivo?: string}>}
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const apiKey = (process.env.BREVO_API_KEY || "").trim();
  if (!apiKey) return { ok: false, motivo: "BREVO_API_KEY no configurada" };

  const sender = parsearRemitente(remitenteBrevo());
  if (!sender) {
    return { ok: false, motivo: "Falta el remitente: pon BREVO_FROM (o MAIL_FROM) con un correo verificado en Brevo" };
  }

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);
  try {
    const respuesta = await fetch(URL_API, {
      method: "POST",
      headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender,
        to: [{ email: to }],
        subject,
        htmlContent: html,
        ...(text ? { textContent: text } : {}),
      }),
      signal: controlador.signal,
    });
    const cuerpo = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      const motivo = `${respuesta.status} ${cuerpo.code || ""} ${cuerpo.message || ""}`.trim();
      Logger.error("Brevo respondió con error", { destino: to, asunto: subject, motivo });
      return { ok: false, motivo };
    }
    return { ok: true, id: cuerpo.messageId || null };
  } catch (error) {
    const motivo = error.name === "AbortError" ? `Sin respuesta de Brevo en ${TIMEOUT_MS / 1000} s` : error.message;
    Logger.error("Error enviando correo con Brevo", { destino: to, asunto: subject, error: motivo });
    return { ok: false, motivo };
  } finally {
    clearTimeout(temporizador);
  }
};

module.exports = { sendEmail, parsearRemitente, remitenteBrevo };
