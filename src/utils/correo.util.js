/**
 * @module CorreoUtil
 * @description Forma canónica de un correo para guardarlo y buscarlo.
 *
 * Un correo se guarda y se compara en minúsculas y sin espacios alrededor, y NADA más. Antes
 * el login y el registro público lo pasaban por `normalizeEmail()` de express-validator, que
 * además reescribe la dirección: en Gmail quita los puntos y lo que va tras un "+"
 * ("juan.perez@gmail.com" -> "juanperez@gmail.com"). Crear o editar una cuenta desde el
 * administrador no lo hacía, así que esa cuenta quedaba guardada CON puntos y el login la
 * buscaba SIN ellos: "Credenciales inválidas" con la contraseña correcta.
 */

const { normalizeEmail } = require('validator');

/**
 * Minúsculas y sin espacios alrededor. Es la forma con la que se guarda un correo.
 * @param {unknown} correo
 * @returns {string}
 */
const normalizarCorreo = (correo) => String(correo ?? '').trim().toLowerCase();

/**
 * Formas en las que puede estar guardado un correo: la canónica y, para las cuentas que se
 * registraron mientras el registro público usaba `normalizeEmail()`, la que dejaba esa
 * función (sin puntos ni "+etiqueta" en Gmail). Así esas cuentas siguen pudiendo entrar
 * escribiendo su correo tal cual.
 * @param {unknown} correo
 * @returns {string[]} Sin repetidos; la canónica siempre primero.
 */
const formasGuardadasDelCorreo = (correo) => {
  const canonico = normalizarCorreo(correo);
  const heredado = normalizeEmail(canonico) || canonico;
  return heredado === canonico ? [canonico] : [canonico, heredado];
};

module.exports = { normalizarCorreo, formasGuardadasDelCorreo };
