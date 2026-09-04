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

// El id 3 se llama "Conductor" también en la tabla real (migración 003). Se llamaba
// "Comunidad sena", que no decía lo que ese rol hace: es quien parquea. Nada autoriza por
// el texto -- todo va por id -- así que el cambio es solo de exhibición; los clientes que
// sigan enviando el nombre viejo entran por ALIAS_ROL, más abajo.
const NOMBRES_ROL = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.VIGILANTE]: 'Vigilante',
  [ROLES.CONDUCTOR]: 'Conductor',
};

// Alias en texto (sin acentos, insensible a mayúsculas) por si el cliente envía el nombre
// del rol en vez de su ID. "comunidad sena" se conserva a propósito: es el nombre que tuvo
// el rol 3 hasta la migración 003, y quien lo envíe debe seguir resolviendo al mismo rol.
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
