/**
 * Verifica que el código no referencia las columnas eliminadas por
 * database/migraciones/010_eliminar_columnas_sin_uso.sql ni las tablas de 009.
 * Se ejecuta con: node --test tests/
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const models = require("../src/models");
const celdaRepo = require("../src/repositories/celda.repository");
const vehiculoRepo = require("../src/repositories/vehiculo.repository");
const parqueaderoRepo = require("../src/repositories/parqueadero.repository");
const evidenciaRepo = require("../src/repositories/evidenciaNovedad.repository");

// --- 010: columnas que ya no existen en el modelo -------------------------
const columnasEliminadas = {
  Parqueadero: ["plano_url", "observaciones"],
  Celda: ["posicion_x", "posicion_y", "ancho", "alto"],
  Vehiculo: ["tarjeta_propiedad", "cilindraje", "servicio", "carroceria", "combustible", "capacidad", "numero_motor", "numero_chasis"],
  Modulo: ["descripcion", "estado"],
  TipoUsuario: ["descripcion", "estado"],
  EvidenciaNovedad: ["fecha_hora"],
  Conductor: ["fecha_creacion"],
  DetallePropiedad: ["fecha_registro"],
  RolPermiso: ["fecha_asignacion"],
  Rol: ["fecha_creacion"],
};

for (const [modelo, campos] of Object.entries(columnasEliminadas)) {
  const M = models[modelo];
  assert.ok(M, `El modelo ${modelo} debe existir`);
  for (const campo of campos) {
    assert.equal(campo in M.rawAttributes, false, `${modelo} no debe declarar '${campo}'`);
  }
}
// Modelos cuya única columna de fecha se eliminó: sin timestamps automáticos.
// (Vehiculo conserva fecha_creacion porque alimenta trg_vehiculo_auditoria.)
for (const modelo of ["Conductor", "DetallePropiedad", "RolPermiso", "Rol"]) {
  assert.equal(models[modelo].options.timestamps, false, `${modelo} no debe usar timestamps automáticos`);
}

// --- 010: columnas que se CONSERVAN a propósito ---------------------------
const columnasConservadas = {
  Novedad: ["registro_acceso_id", "fecha_hora_cierre"],
  RegistroAcceso: ["descripcion_ingreso", "descripcion_salida"],
  Vehiculo: ["vehiculo_sena", "fecha_creacion"],
  Celda: ["observaciones"],
  RolPermiso: ["estado"],
};
for (const [modelo, campos] of Object.entries(columnasConservadas)) {
  for (const campo of campos) {
    assert.ok(campo in models[modelo].rawAttributes, `${modelo} debe conservar '${campo}'`);
  }
}

// --- repositorios: allowedFields sin columnas eliminadas ------------------
const fuentes = {
  "celda.repository": celdaRepo.create.toString() + celdaRepo.update.toString(),
  "vehiculo.repository": vehiculoRepo.update.toString(),
  "parqueadero.repository": fs.readFileSync(path.join(__dirname, "../src/repositories/parqueadero.repository.js"), "utf8"),
  "evidenciaNovedad.repository": evidenciaRepo.findByNovedad.toString(),
};
const todasLasColumnas = [...new Set(Object.values(columnasEliminadas).flat())]
  .filter((c) => !["descripcion", "estado", "observaciones", "fecha_creacion"].includes(c)); // nombres compartidos con columnas vivas
for (const [nombre, src] of Object.entries(fuentes)) {
  for (const campo of todasLasColumnas) {
    assert.equal(src.includes(`'${campo}'`), false, `${nombre} no debe manejar '${campo}'`);
  }
}
assert.equal(fuentes["evidenciaNovedad.repository"].includes("fecha_hora"), false, "evidencias ya no se ordenan por fecha_hora");

// --- 009: tablas eliminadas sin modelo ni referencia en src/ --------------
const tablasEliminadas = [
  "autorizacion_acceso", "captura_placa", "intento_ocr", "encuesta", "valoracion",
  "licencia_conduccion", "parqueadero_ip_autorizada",
];
const leerTodo = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const full = path.join(dir, e.name);
  return e.isDirectory() ? leerTodo(full) : full.endsWith(".js") ? [fs.readFileSync(full, "utf8")] : [];
});
const srcConcatenado = leerTodo(path.join(__dirname, "../src")).join("\n");
for (const tabla of tablasEliminadas) {
  assert.equal(new RegExp(`\\b${tabla}\\b`).test(srcConcatenado), false, `src/ no debe referenciar la tabla '${tabla}'`);
}

console.log("OK: código alineado con migraciones 009 y 010");
