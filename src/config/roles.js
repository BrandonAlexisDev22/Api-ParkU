/**
 * @module Roles
 * @description IDs de rol tal como quedaron precargados en database/parku.postgres
 * (tabla 'rol'). Administrador=1, Vigilante=2, Conductor=3 -- este orden es
 * distinto al que usaba el código anterior (Vigilante=1, Admin=2), así que
 * cualquier verificarRol([...]) debe usar estas constantes, nunca números sueltos.
 */

const ROLES = {
  ADMIN: 1,
  VIGILANTE: 2,
  CONDUCTOR: 3,
};

module.exports = { ROLES };
