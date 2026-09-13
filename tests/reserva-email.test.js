const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const loadReservaServiceWithStubs = (mailCalls) => {
  const originalLoad = Module._load;

  Module._load = function (request, parent, isMain) {
    if (request === "../repositories/reserva.repository") {
      return {
        findConflictos: async () => [],
        create: async (payload) => ({
          id: 42,
          ...payload,
          estado: "ACEPTADA",
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

  delete require.cache[require.resolve("../src/services/reserva.service")];
  const svc = require("../src/services/reserva.service");

  return {
    svc,
    restore: () => {
      Module._load = originalLoad;
      delete require.cache[require.resolve("../src/services/reserva.service")];
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
