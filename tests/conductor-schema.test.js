const assert = require("node:assert/strict");
const Conductor = require("../src/models/conductores.models");
const conductorRepo = require("../src/repositories/conductor.repository");

const obsoleteColumns = [
  "regional_formacion",
  "centro_formacion",
  "programa_formacion",
];

for (const field of obsoleteColumns) {
  assert.equal(
    field in Conductor.rawAttributes,
    false,
    `El esquema de conductor no debe incluir el campo obsoleto '${field}'`,
  );
}

const createSource = conductorRepo.create.toString();
const updateSource = conductorRepo.update.toString();
for (const field of obsoleteColumns) {
  assert.equal(
    createSource.includes(field),
    false,
    `El repositorio de creación no debe manejar '${field}'`,
  );
  assert.equal(
    updateSource.includes(field),
    false,
    `El repositorio de actualización no debe manejar '${field}'`,
  );
}

console.log("OK: esquema de conductor sin campos formativos obsoletos");
