const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const express = require("express");
const { body, validationResult } = require("express-validator");

const { normalizarCorreo, formasGuardadasDelCorreo } = require("../src/utils/correo.util");

/* Bug reportado: tras editar el correo de una cuenta desde el administrador, esa persona ya
   no podía iniciar sesión ("Credenciales inválidas"). El login pasaba el correo por
   normalizeEmail(), que en Gmail quita los puntos, y el administrador lo guardaba con ellos. */

test("normalizarCorreo solo pasa a minúsculas y quita espacios: conserva puntos y +etiqueta", () => {
  assert.equal(normalizarCorreo("  Juan.Perez+sena@Gmail.com "), "juan.perez+sena@gmail.com");
});

test("formasGuardadasDelCorreo incluye la forma heredada de normalizeEmail() para Gmail", () => {
  assert.deepEqual(formasGuardadasDelCorreo("Juan.Perez@gmail.com"), [
    "juan.perez@gmail.com",
    "juanperez@gmail.com",
  ]);
});

test("formasGuardadasDelCorreo no duplica cuando las dos formas coinciden", () => {
  assert.deepEqual(formasGuardadasDelCorreo("ana@sena.edu.co"), ["ana@sena.edu.co"]);
});

/** Carga el repositorio con un modelo Usuario falso que guarda las filas en memoria. */
const cargarRepoCon = (filas) => {
  const originalLoad = Module._load;
  const consultas = [];
  Module._load = function (request, parent, isMain) {
    if (request === "../models") {
      return {
        Usuario: {
          findAll: async ({ where }) => {
            consultas.push(where.correo);
            return filas
              .filter((f) => where.correo.includes(f.correo))
              .map((f) => ({ ...f, toJSON: () => ({ ...f }) }));
          },
        },
        Rol: {},
        Conductor: {},
      };
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  const ruta = require.resolve("../src/repositories/usuario.repository");
  delete require.cache[ruta];
  try {
    return { repo: require(ruta), consultas };
  } finally {
    Module._load = originalLoad;
    delete require.cache[ruta];
  }
};

test("findParaAcceso encuentra una cuenta guardada con puntos desde el administrador", async () => {
  const { repo } = cargarRepoCon([{ id: 1, correo: "juan.perez@gmail.com" }]);
  const cuenta = await repo.findParaAcceso("juan.perez@gmail.com");
  assert.equal(cuenta?.id, 1);
});

test("findParaAcceso sigue encontrando una cuenta registrada con la forma de normalizeEmail()", async () => {
  const { repo } = cargarRepoCon([{ id: 2, correo: "juanperez@gmail.com" }]);
  const cuenta = await repo.findParaAcceso("juan.perez@gmail.com");
  assert.equal(cuenta?.id, 2);
});

test("findParaAcceso prefiere la coincidencia exacta si existen las dos cuentas", async () => {
  const { repo } = cargarRepoCon([
    { id: 2, correo: "juanperez@gmail.com" },
    { id: 1, correo: "juan.perez@gmail.com" },
  ]);
  const cuenta = await repo.findParaAcceso("juan.perez@gmail.com");
  assert.equal(cuenta?.id, 1);
});

test("el validador del login ya no quita los puntos del correo de Gmail", async () => {
  // Misma cadena que loginValidation en src/routes/auth.routes.js.
  const app = express();
  app.use(express.json());
  app.post(
    "/login",
    body("correo").trim().toLowerCase().isEmail(),
    (req, res) => res.json({ errores: validationResult(req).array().length, correo: req.body.correo }),
  );
  const servidor = app.listen(0);
  try {
    const { port } = servidor.address();
    const respuesta = await fetch(`http://127.0.0.1:${port}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: "  Juan.Perez@Gmail.com " }),
    });
    const datos = await respuesta.json();
    assert.equal(datos.errores, 0);
    assert.equal(datos.correo, "juan.perez@gmail.com");
  } finally {
    servidor.close();
  }
});
