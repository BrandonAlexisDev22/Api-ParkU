const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

// reserva.service carga (vía sus dependencias) auth.middleware, que se niega a arrancar sin
// JWT_SECRET. Sin esto la suite fallaba en cualquier máquina sin .env, no por los correos.
process.env.JWT_SECRET ||= "secreto-solo-para-tests";

// avisosConductor.service es quien de verdad llama al mailer: si queda en caché entre tests,
// el segundo test sigue usando el mailer falso del primero y no ve sus propios correos.
const MODULOS_A_RECARGAR = [
  "../src/services/reserva.service",
  "../src/services/avisosConductor.service",
];
const limpiarCache = () => {
  for (const m of MODULOS_A_RECARGAR) delete require.cache[require.resolve(m)];
};

const loadReservaServiceWithStubs = (mailCalls) => {
  const originalLoad = Module._load;

  Module._load = function (request, parent, isMain) {
    if (request === "../repositories/reserva.repository") {
      return {
        findConflictos: async () => [],
        create: async (payload) => ({
          id: 42,
          ...payload,
          // Refleja el estado que le mandó el service (ACEPTADA si lo registra
          // Admin/Vigilante, PENDIENTE si no viene en el payload) en vez de forzarlo,
          // para poder probar los dos correos de creación con el mismo stub.
          estado: payload.estado || "PENDIENTE",
          usuario_registra_id: payload.usuario_registra_id,
          conductor_id: payload.conductor_id,
          celda_id: payload.celda_id,
          fecha_hora_inicio: payload.fecha_hora_inicio,
          fecha_hora_fin: payload.fecha_hora_fin,
        }),
      };
    }

    if (request === "../repositories/celda.repository") {
      return {
        findById: async () => ({
          id: 12,
          numero: "A-12",
          parqueadero: 99,
          estado: "DISPONIBLE",
        }),
      };
    }

    if (request === "../repositories/parqueadero.repository") {
      return {
        findById: async () => ({
          id: 99,
          nombre: "Parqueadero Norte",
          estado: true,
        }),
      };
    }

    if (request === "../repositories/conductor.repository") {
      return {
        findById: async () => ({
          id: 77,
          nombre_apellidos: "Ana Gómez",
          correo: "ana@example.com",
        }),
        // Solo lo consulta _validarPropiedad cuando quien crea NO es Admin/Vigilante: un
        // Conductor creando su propia reserva.
        findByUsuarioId: async () => ({ id: 77 }),
      };
    }

    if (request === "../utils/dbContext.util") {
      return {
        runWithUsuario: async (_usuarioId, fn) => fn({}),
        traducirErrorTrigger: (error) => {
          throw error;
        },
      };
    }

    if (request === "../utils/mailer.util") {
      return {
        enviarCorreoReserva: (...args) => {
          mailCalls.push(args);
          return "EMAIL";
        },
        enviarSinBloquear: async (envio) => envio,
      };
    }

    return originalLoad.apply(this, arguments);
  };

  limpiarCache();
  const svc = require("../src/services/reserva.service");

  return {
    svc,
    restore: () => {
      Module._load = originalLoad;
      limpiarCache();
    },
  };
};

test("create envía correo cuando la reserva se acepta de inmediato", async () => {
  const mailCalls = [];
  const { svc, restore } = loadReservaServiceWithStubs(mailCalls);

  try {
    let inicio = new Date(Date.now() + 24 * 60 * 60 * 1000);
    while (inicio.getDay() === 0 || inicio.getDay() === 6) {
      inicio = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
    }
    inicio.setHours(10, 0, 0, 0);
    const fin = new Date(inicio.getTime() + 2 * 60 * 60 * 1000);

    const data = {
      tipo_reserva: "VEHICULO_SENA",
      celda_id: 12,
      conductor_id: 77,
      motivo: "Reserva de prueba",
      fecha_hora_inicio: inicio.toISOString(),
      fecha_hora_fin: fin.toISOString(),
    };

    const reserva = await svc.create(data, 10, 1);

    assert.equal(reserva.estado, "ACEPTADA");
    assert.ok(
      mailCalls.some(
        ([destino, nombre, estado]) =>
          destino === "ana@example.com" &&
          nombre === "Ana Gómez" &&
          estado === "ACEPTADA",
      ),
    );
  } finally {
    restore();
  }
});

test("create envía correo de confirmación cuando la reserva queda pendiente", async () => {
  const mailCalls = [];
  const { svc, restore } = loadReservaServiceWithStubs(mailCalls);

  try {
    let inicio = new Date(Date.now() + 24 * 60 * 60 * 1000);
    while (inicio.getDay() === 0 || inicio.getDay() === 6) {
      inicio = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
    }
    inicio.setHours(10, 0, 0, 0);
    const fin = new Date(inicio.getTime() + 2 * 60 * 60 * 1000);

    const data = {
      tipo_reserva: "VEHICULO_SENA",
      celda_id: 12,
      conductor_id: 77,
      motivo: "Reserva de prueba",
      fecha_hora_inicio: inicio.toISOString(),
      fecha_hora_fin: fin.toISOString(),
    };

    // usuarioRol 3 = Conductor: la reserva nace PENDIENTE, a la espera de que
    // Admin/Vigilante la gestione.
    const reserva = await svc.create(data, 10, 3);

    assert.equal(reserva.estado, "PENDIENTE");
    assert.ok(
      mailCalls.some(
        ([destino, nombre, estado]) =>
          destino === "ana@example.com" &&
          nombre === "Ana Gómez" &&
          estado === "PENDIENTE",
      ),
    );
  } finally {
    restore();
  }
});
