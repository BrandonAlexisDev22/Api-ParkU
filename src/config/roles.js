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

const NOMBRES_ROL = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.VIGILANTE]: 'Vigilante',
  [ROLES.CONDUCTOR]: 'Conductor',
};

// Alias en texto (sin acentos, insensible a mayúsculas) por si el cliente envía el nombre
// del rol en vez de su ID.
const ALIAS_ROL = {
  administrador: ROLES.ADMIN,
  admin: ROLES.ADMIN,
  vigilante: ROLES.VIGILANTE,
  conductor: ROLES.CONDUCTOR,
};

/**
 * Resuelve el identificador de rol que envía el cliente -- puede venir como número
 * (1/2/3), como string numérico ("1") o como nombre ("Administrador", "vigilante"...).
 * Devuelve `undefined` si `valor` no vino (para que el caller decida el default) y
 * lanza 400 si vino algo que no corresponde a ningún rol real -- así un valor
 * irreconocible nunca cae silenciosamente en Conductor.
 * @param {number|string|undefined|null} valor
 * @throws {Object} 400 si `valor` no es un rol válido.
 * @returns {number|undefined}
 */
const resolverRolId = (valor) => {
  if (valor === undefined || valor === null || valor === '') return undefined;

  const comoNumero = Number(valor);
  if (Number.isInteger(comoNumero) && Object.values(ROLES).includes(comoNumero)) {
    return comoNumero;
  }

  if (typeof valor === 'string') {
    const resuelto = ALIAS_ROL[valor.trim().toLowerCase()];
    if (resuelto) return resuelto;
  }

  throw {
    status: 400,
    message: `Rol inválido: "${valor}". Use 1 (Administrador), 2 (Vigilante), 3 (Conductor), o el nombre correspondiente.`,
  };
};

module.exports = { ROLES, NOMBRES_ROL, resolverRolId };
