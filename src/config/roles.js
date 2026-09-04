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

// NOTA: en la tabla real `rol`, el id 3 se llama "Comunidad sena" (no "Conductor" -- ese
// era solo el nombre histórico de esta constante). Es el mismo id/rol; ROLES.CONDUCTOR se
// mantiene como nombre de la constante para no romper todas las referencias existentes en
// el código, pero el nombre de exhibición real es "Comunidad SENA".
const NOMBRES_ROL = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.VIGILANTE]: 'Vigilante',
  [ROLES.CONDUCTOR]: 'Comunidad SENA',
};

// Alias en texto (sin acentos, insensible a mayúsculas) por si el cliente envía el nombre
// del rol en vez de su ID.
const ALIAS_ROL = {
  administrador: ROLES.ADMIN,
  admin: ROLES.ADMIN,
  vigilante: ROLES.VIGILANTE,
  conductor: ROLES.CONDUCTOR,
  'comunidad sena': ROLES.CONDUCTOR,
  'comunidad_sena': ROLES.CONDUCTOR,
};

// NOTA: aquí ya NO vive la resolución del rol que envía el cliente. Antes existía un
// resolverRolId() que validaba contra Object.values(ROLES), es decir contra esta lista
// fija de tres: en cuanto se creaba un rol nuevo desde POST /api/roles, asignárselo a un
// usuario respondía "Rol inválido" aunque el rol existiera en la base de datos. La
// resolución dinámica (contra la tabla `rol` real) está en usuario.service.js.
//
// Estas constantes siguen aquí porque son otra cosa: los IDs de los tres roles que el
// código necesita reconocer por nombre para decidir permisos de negocio
// (verificarRol([ROLES.ADMIN]), "¿quien crea la reserva es Vigilante?"...). Son roles del
// sistema, no el catálogo completo.

module.exports = { ROLES, NOMBRES_ROL, ALIAS_ROL };
