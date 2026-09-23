const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

/* Por qué no llegaban los correos: sin acceso a las variables ni a los logs del servidor no
   había forma de saberlo. diagnosticoCorreo() y el motivo que devuelve enviarCorreo() lo dicen. */

const VARIABLES = ["RENDER", "BREVO_API_KEY", "BREVO_FROM", "RESEND_API_KEY", "RESEND_FROM", "RESEND_DOMAIN", "MAIL_FROM", "MAIL_SERVICE", "SMTP_SERVICE", "SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASSWORD", "FRONTEND_URL"];

/** Carga mailer.util con estas variables de entorno y un Resend falso. */
const cargarMailer = (env, respuestaResend = { ok: true, id: "r1" }) => {
  const guardadas = Object.fromEntries(VARIABLES.map((k) => [k, process.env[k]]));
  for (const k of VARIABLES) delete process.env[k];
  Object.assign(process.env, env);

  const originalLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === "./resend.util") {
      return {
        sendEmail: async () => respuestaResend,
        getDefaultFrom: () => process.env.RESEND_FROM || process.env.MAIL_FROM || "ParkU <onboarding@resend.dev>",
      };
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  const ruta = require.resolve("../src/utils/mailer.util");
  delete require.cache[ruta];
  let mailer;
  try {
    mailer = require(ruta);
  } finally {
    Module._load = originalLoad;
  }
  const restaurar = () => {
    delete require.cache[ruta];
    for (const k of VARIABLES) delete process.env[k];
    for (const [k, v] of Object.entries(guardadas)) if (v !== undefined) process.env[k] = v;
  };
  return { mailer, restaurar };
};

test("sin ningún proveedor, el diagnóstico lo dice", () => {
  const { mailer, restaurar } = cargarMailer({ FRONTEND_URL: "https://park-u.vercel.app" });
  try {
    const d = mailer.diagnosticoCorreo();
    assert.equal(d.proveedorPrincipal, null);
    assert.ok(d.advertencias.some((a) => /No hay ningún proveedor/.test(a)));
  } finally {
    restaurar();
  }
});

test("Resend con el remitente de pruebas onboarding@resend.dev avisa que solo entrega al dueño", () => {
  const { mailer, restaurar } = cargarMailer({ RESEND_API_KEY: "re_x", FRONTEND_URL: "https://x" });
  try {
    const d = mailer.diagnosticoCorreo();
    assert.equal(d.proveedorPrincipal, "resend");
    assert.match(d.resend.remitente, /onboarding@resend\.dev/);
    assert.ok(d.advertencias.some((a) => /SOLO entrega correos al dueño/.test(a)));
  } finally {
    restaurar();
  }
});

test("Resend con un remitente de Gmail (vía MAIL_FROM) avisa que Resend no lo permite", () => {
  const { mailer, restaurar } = cargarMailer({ RESEND_API_KEY: "re_x", MAIL_FROM: "parku@gmail.com", FRONTEND_URL: "https://x" });
  try {
    const d = mailer.diagnosticoCorreo();
    assert.ok(d.advertencias.some((a) => /gmail\.com: Resend no permite/.test(a)));
    assert.ok(d.advertencias.some((a) => /RESEND_FROM está vacío/.test(a)));
  } finally {
    restaurar();
  }
});

test("Resend con dominio propio y FRONTEND_URL no tiene advertencias, y nunca expone la clave", () => {
  const { mailer, restaurar } = cargarMailer({ RESEND_API_KEY: "re_secreta", RESEND_FROM: "ParkU <noreply@parku.co>", FRONTEND_URL: "https://park-u.vercel.app" });
  try {
    const d = mailer.diagnosticoCorreo();
    assert.deepEqual(d.advertencias, []);
    assert.ok(!JSON.stringify(d).includes("re_secreta"));
  } finally {
    restaurar();
  }
});

test("sin FRONTEND_URL avisa que los enlaces quedan incompletos", () => {
  const { mailer, restaurar } = cargarMailer({ RESEND_API_KEY: "re_x", RESEND_FROM: "ParkU <noreply@parku.co>" });
  try {
    assert.ok(mailer.diagnosticoCorreo().advertencias.some((a) => /FRONTEND_URL está vacío/.test(a)));
  } finally {
    restaurar();
  }
});

test("si Resend rechaza el correo y no hay SMTP, enviarCorreo devuelve el motivo real de Resend", async () => {
  const { mailer, restaurar } = cargarMailer(
    { RESEND_API_KEY: "re_x" },
    { ok: false, motivo: "You can only send testing emails to your own email address" },
  );
  try {
    const r = await mailer.enviarCorreo({ destino: "ana@sena.edu.co", asunto: "x", html: "<p>x</p>" });
    assert.equal(r.enviado, false);
    assert.match(r.motivo, /^Resend: You can only send testing emails/);
  } finally {
    restaurar();
  }
});

test("si Resend acepta el correo, enviarCorreo lo reporta como enviado por Resend", async () => {
  const { mailer, restaurar } = cargarMailer({ RESEND_API_KEY: "re_x" });
  try {
    const r = await mailer.enviarCorreo({ destino: "ana@sena.edu.co", asunto: "x", html: "<p>x</p>" });
    assert.deepEqual(r, { enviado: true, proveedor: "resend", id: "r1" });
  } finally {
    restaurar();
  }
});

/* Brevo por API: el SMTP de Brevo daba "Connection timeout" en Render (puertos SMTP bloqueados). */

/** Reemplaza fetch global durante una prueba y devuelve las llamadas que recibió. */
const conFetchFalso = (respuesta) => {
  const original = globalThis.fetch;
  const llamadas = [];
  globalThis.fetch = async (url, opciones) => {
    llamadas.push({ url, opciones, cuerpo: JSON.parse(opciones.body) });
    return new Response(JSON.stringify(respuesta.cuerpo), { status: respuesta.status });
  };
  return { llamadas, restaurar: () => { globalThis.fetch = original; } };
};

test("con BREVO_API_KEY, el correo sale por la API HTTPS de Brevo con el remitente de BREVO_FROM", async () => {
  const f = conFetchFalso({ status: 201, cuerpo: { messageId: "<m1@brevo>" } });
  const { mailer, restaurar } = cargarMailer({
    BREVO_API_KEY: "xkeysib-abc",
    BREVO_FROM: "ParkU <avisos@parku.co>",
    SMTP_HOST: "smtp-relay.sendinblue.com",
  });
  try {
    const r = await mailer.enviarCorreo({ destino: "ana@sena.edu.co", asunto: "Hola", html: "<p>x</p>", texto: "x" });
    assert.deepEqual(r, { enviado: true, proveedor: "brevo", id: "<m1@brevo>" });
    assert.equal(f.llamadas.length, 1);
    assert.equal(f.llamadas[0].url, "https://api.brevo.com/v3/smtp/email");
    assert.equal(f.llamadas[0].opciones.headers["api-key"], "xkeysib-abc");
    assert.deepEqual(f.llamadas[0].cuerpo, {
      sender: { name: "ParkU", email: "avisos@parku.co" },
      to: [{ email: "ana@sena.edu.co" }],
      subject: "Hola",
      htmlContent: "<p>x</p>",
      textContent: "x",
    });
  } finally {
    restaurar();
    f.restaurar();
  }
});

test("si Brevo rechaza el correo y no hay SMTP, devuelve el motivo de Brevo", async () => {
  const f = conFetchFalso({ status: 400, cuerpo: { code: "invalid_parameter", message: "sender is not valid" } });
  const { mailer, restaurar } = cargarMailer({ BREVO_API_KEY: "xkeysib-abc", BREVO_FROM: "x@noverificado.com" });
  try {
    const r = await mailer.enviarCorreo({ destino: "ana@sena.edu.co", asunto: "Hola", html: "<p>x</p>" });
    assert.equal(r.enviado, false);
    assert.match(r.motivo, /Brevo: 400 invalid_parameter sender is not valid/);
  } finally {
    restaurar();
    f.restaurar();
  }
});

test("sin remitente, Brevo no llama a la API y lo dice", async () => {
  const f = conFetchFalso({ status: 201, cuerpo: {} });
  const { mailer, restaurar } = cargarMailer({ BREVO_API_KEY: "xkeysib-abc" });
  try {
    const r = await mailer.enviarCorreo({ destino: "ana@sena.edu.co", asunto: "Hola", html: "<p>x</p>" });
    assert.equal(r.enviado, false);
    assert.match(r.motivo, /Falta el remitente/);
    assert.equal(f.llamadas.length, 0);
  } finally {
    restaurar();
    f.restaurar();
  }
});

test("en Render con solo SMTP, el diagnóstico avisa que los puertos SMTP están bloqueados", () => {
  const { mailer, restaurar } = cargarMailer({ RENDER: "true", SMTP_HOST: "smtp-relay.sendinblue.com", FRONTEND_URL: "https://x" });
  try {
    const d = mailer.diagnosticoCorreo();
    assert.equal(d.proveedorPrincipal, "smtp");
    assert.ok(d.advertencias.some((a) => /Render y solo tiene SMTP/.test(a)));
  } finally {
    restaurar();
  }
});

test("con una clave SMTP de Brevo en BREVO_API_KEY, el diagnóstico lo detecta", () => {
  const { mailer, restaurar } = cargarMailer({ BREVO_API_KEY: "xsmtpsib-abc", BREVO_FROM: "a@b.co", FRONTEND_URL: "https://x" });
  try {
    const d = mailer.diagnosticoCorreo();
    assert.equal(d.proveedorPrincipal, "brevo");
    assert.ok(d.advertencias.some((a) => /clave SMTP/.test(a)));
    assert.ok(!JSON.stringify(d).includes("xsmtpsib-abc"));
  } finally {
    restaurar();
  }
});
