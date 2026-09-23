const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const USUARIO = {
  id: 10,
  correo: "ana@example.com",
  nombre: "Ana Gómez",
  tipo_documento: "CC",
  numero_documento: "123456789",
};

const loadServiceWithStubs = ({ usuario = USUARIO, solicitudes = {} } = {}) => {
  const originalLoad = Module._load;
  const llamadas = {
    invalidarPendientes: [],
    create: [],
    marcarUsado: [],
    updateContrasena: [],
    desbloquearTrasRecuperacion: [],
  };

  Module._load = function (request, parent, isMain) {
    if (request === "../repositories/recuperacionPassword.repository") {
      return {
        invalidarPendientes: async (usuarioId) => {
          llamadas.invalidarPendientes.push(usuarioId);
        },
        create: async (data) => {
          llamadas.create.push(data);
          return { id: 1, ...data, usado: false };
        },
        findByTokenHash: async (tokenHash) => solicitudes[tokenHash] ?? null,
        marcarUsado: async (id) => {
          llamadas.marcarUsado.push(id);
        },
      };
    }

    if (request === "../repositories/usuario.repository") {
      return {
        findByCorreo: async (correo) => (usuario && correo === usuario.correo ? usuario : null),
        findParaAcceso: async (correo) => (usuario && correo === usuario.correo ? usuario : null),
        updateContrasena: async (id, contrasena) => {
          llamadas.updateContrasena.push({ id, contrasena });
        },
        desbloquearTrasRecuperacion: async (id) => {
          llamadas.desbloquearTrasRecuperacion.push(id);
        },
      };
    }

    return originalLoad.apply(this, arguments);
  };

  delete require.cache[require.resolve("../src/services/recuperacionPassword.service")];
  const svc = require("../src/services/recuperacionPassword.service");

  return {
    svc,
    llamadas,
    restore: () => {
      Module._load = originalLoad;
      delete require.cache[require.resolve("../src/services/recuperacionPassword.service")];
    },
  };
};

test("verificarIdentidad() con datos que coinciden genera un token y lo devuelve en claro", async () => {
  const { svc, llamadas, restore } = loadServiceWithStubs();

  try {
    const token = await svc.verificarIdentidad(USUARIO.correo, "cc", USUARIO.numero_documento, USUARIO.nombre);

    assert.equal(llamadas.invalidarPendientes.length, 1);
    assert.equal(llamadas.invalidarPendientes[0], USUARIO.id);

    assert.equal(llamadas.create.length, 1);
    assert.equal(llamadas.create[0].usuario_id, USUARIO.id);
    // El token en claro nunca se guarda: solo su hash SHA-256 (64 hex).
    assert.match(llamadas.create[0].token_hash, /^[0-9a-f]{64}$/);
    assert.ok(llamadas.create[0].fecha_expiracion instanceof Date);

    // El token devuelto es el mismo que se hasheó y guardó.
    const crypto = require("crypto");
    assert.equal(crypto.createHash("sha256").update(token).digest("hex"), llamadas.create[0].token_hash);
  } finally {
    restore();
  }
});

test("verificarIdentidad() con un correo sin cuenta no crea token", async () => {
  const { svc, llamadas, restore } = loadServiceWithStubs({ usuario: null });

  try {
    await assert.rejects(
      () => svc.verificarIdentidad("nadie@example.com", "CC", "123456789", "Cualquiera"),
      (error) => {
        assert.equal(error.status, 400);
        assert.match(error.message, /no coinciden/i);
        return true;
      },
    );
    assert.equal(llamadas.create.length, 0);
  } finally {
    restore();
  }
});

test("verificarIdentidad() rechaza cuando el documento no coincide con la cuenta del correo", async () => {
  const { svc, llamadas, restore } = loadServiceWithStubs();

  try {
    await assert.rejects(
      () => svc.verificarIdentidad(USUARIO.correo, "CC", "000000000", USUARIO.nombre),
      (error) => {
        assert.equal(error.status, 400);
        assert.match(error.message, /no coinciden/i);
        return true;
      },
    );
    assert.equal(llamadas.create.length, 0);
  } finally {
    restore();
  }
});

test("verificarIdentidad() rechaza cuando el nombre no coincide con la cuenta del correo", async () => {
  const { svc, llamadas, restore } = loadServiceWithStubs();

  try {
    await assert.rejects(
      () => svc.verificarIdentidad(USUARIO.correo, "CC", USUARIO.numero_documento, "Otra Persona"),
      (error) => {
        assert.equal(error.status, 400);
        return true;
      },
    );
    assert.equal(llamadas.create.length, 0);
  } finally {
    restore();
  }
});

test("verificarIdentidad() rechaza un correo con formato inválido antes de tocar la base de datos", async () => {
  const { svc, llamadas, restore } = loadServiceWithStubs();

  try {
    await assert.rejects(
      () => svc.verificarIdentidad("no-es-un-correo", "CC", USUARIO.numero_documento, USUARIO.nombre),
      (error) => {
        assert.equal(error.status, 400);
        return true;
      },
    );
    assert.equal(llamadas.create.length, 0);
  } finally {
    restore();
  }
});

test("verificarIdentidad() rechaza un tipo de documento que no existe en el catálogo", async () => {
  const { svc, llamadas, restore } = loadServiceWithStubs();

  try {
    await assert.rejects(
      () => svc.verificarIdentidad(USUARIO.correo, "XX", USUARIO.numero_documento, USUARIO.nombre),
      (error) => {
        assert.equal(error.status, 400);
        return true;
      },
    );
    assert.equal(llamadas.create.length, 0);
  } finally {
    restore();
  }
});

test("restablecer() con un token válido y sin usar actualiza la contraseña y quema el token", async () => {
  const crypto = require("crypto");
  const tokenEnClaro = "token-de-prueba";
  const hashReal = crypto.createHash("sha256").update(tokenEnClaro).digest("hex");
  const solicitud = {
    id: 5,
    usuario_id: USUARIO.id,
    usado: false,
    fecha_expiracion: new Date(Date.now() + 30 * 60 * 1000),
  };
  const { svc, llamadas, restore } = loadServiceWithStubs({
    solicitudes: { [hashReal]: solicitud },
  });

  try {
    await svc.restablecer(tokenEnClaro, "NuevaClave123");

    assert.equal(llamadas.updateContrasena.length, 1);
    assert.equal(llamadas.updateContrasena[0].id, USUARIO.id);
    // Si la cuenta se había bloqueado por intentos fallidos, la contraseña nueva la desbloquea.
    assert.deepEqual(llamadas.desbloquearTrasRecuperacion, [USUARIO.id]);
    assert.equal(llamadas.marcarUsado.length, 1);
    assert.equal(llamadas.marcarUsado[0], solicitud.id);
  } finally {
    restore();
  }
});

test("restablecer() rechaza un token que ya fue usado", async () => {
  const crypto = require("crypto");
  const tokenEnClaro = "token-ya-usado";
  const hashReal = crypto.createHash("sha256").update(tokenEnClaro).digest("hex");
  const solicitud = {
    id: 6,
    usuario_id: USUARIO.id,
    usado: true,
    fecha_expiracion: new Date(Date.now() + 30 * 60 * 1000),
  };
  const { svc, llamadas, restore } = loadServiceWithStubs({
    solicitudes: { [hashReal]: solicitud },
  });

  try {
    await assert.rejects(
      () => svc.restablecer(tokenEnClaro, "NuevaClave123"),
      (error) => {
        assert.equal(error.status, 400);
        assert.match(error.message, /ya fue utilizado/);
        return true;
      },
    );
    assert.equal(llamadas.updateContrasena.length, 0);
    assert.equal(llamadas.desbloquearTrasRecuperacion.length, 0);
  } finally {
    restore();
  }
});

test("restablecer() rechaza un token expirado", async () => {
  const crypto = require("crypto");
  const tokenEnClaro = "token-expirado";
  const hashReal = crypto.createHash("sha256").update(tokenEnClaro).digest("hex");
  const solicitud = {
    id: 7,
    usuario_id: USUARIO.id,
    usado: false,
    fecha_expiracion: new Date(Date.now() - 60 * 1000),
  };
  const { svc, llamadas, restore } = loadServiceWithStubs({
    solicitudes: { [hashReal]: solicitud },
  });

  try {
    await assert.rejects(
      () => svc.restablecer(tokenEnClaro, "NuevaClave123"),
      (error) => {
        assert.equal(error.status, 400);
        assert.match(error.message, /expirado/);
        return true;
      },
    );
    assert.equal(llamadas.updateContrasena.length, 0);
    assert.equal(llamadas.desbloquearTrasRecuperacion.length, 0);
  } finally {
    restore();
  }
});

test("restablecer() rechaza un token inexistente", async () => {
  const { svc, llamadas, restore } = loadServiceWithStubs();

  try {
    await assert.rejects(
      () => svc.restablecer("token-que-no-existe", "NuevaClave123"),
      (error) => {
        assert.equal(error.status, 400);
        assert.match(error.message, /inválido/i);
        return true;
      },
    );
    assert.equal(llamadas.updateContrasena.length, 0);
    assert.equal(llamadas.desbloquearTrasRecuperacion.length, 0);
  } finally {
    restore();
  }
});

test("restablecer() rechaza una contraseña que no cumple la política de fortaleza", async () => {
  const crypto = require("crypto");
  const tokenEnClaro = "token-para-clave-debil";
  const hashReal = crypto.createHash("sha256").update(tokenEnClaro).digest("hex");
  const solicitud = {
    id: 8,
    usuario_id: USUARIO.id,
    usado: false,
    fecha_expiracion: new Date(Date.now() + 30 * 60 * 1000),
  };
  const { svc, llamadas, restore } = loadServiceWithStubs({
    solicitudes: { [hashReal]: solicitud },
  });

  try {
    // Sin mayúscula ni número: la misma política que exige el registro (PasswordUtil).
    await assert.rejects(
      () => svc.restablecer(tokenEnClaro, "clavedebil"),
      (error) => {
        assert.equal(error.status, 400);
        return true;
      },
    );
    assert.equal(llamadas.updateContrasena.length, 0);
    assert.equal(llamadas.desbloquearTrasRecuperacion.length, 0);
  } finally {
    restore();
  }
});
