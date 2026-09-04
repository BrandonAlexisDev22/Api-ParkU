const bcrypt = require('bcryptjs');
require('dotenv').config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

class PasswordUtil {
  /**
   * Encripta una contraseña
   * @param {string} password - Contraseña en texto plano
   * @returns {Promise<string>} - Contraseña encriptada
   */
  static async hash(password) {
    try {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error('Error al encriptar la contraseña');
    }
  }

  /**
   * Compara una contraseña con su hash
   * @param {string} password - Contraseña en texto plano
   * @param {string} hashedPassword - Contraseña encriptada
   * @returns {Promise<boolean>} - true si coinciden
   */
  static async compare(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error('Error al comparar contraseñas');
    }
  }

  /**
   * Política de fortaleza de contraseña, en un solo sitio.
   *
   * Es la misma regla que ya aplicaba registerValidation (express-validator) al registro
   * público, pero POST /api/usuarios no pasa por esa cadena: un administrador podía crear
   * cuentas con la contraseña "1" mientras el registro público exigía 8 caracteres con
   * mayúscula, minúscula y número. Al vivir aquí, las dos rutas rechazan exactamente lo
   * mismo sin duplicar la regla.
   *
   * @param {string} contrasena
   * @throws {Object} 400 si no cumple la política.
   */
  static validarFortaleza(contrasena) {
    if (typeof contrasena !== 'string' || !contrasena) {
      throw { status: 400, message: 'La contraseña es requerida' };
    }
    if (contrasena.length < 8) {
      throw { status: 400, message: 'La contraseña debe tener al menos 8 caracteres' };
    }
    if (!/[A-Z]/.test(contrasena)) {
      throw { status: 400, message: 'La contraseña debe tener al menos una mayúscula' };
    }
    if (!/[a-z]/.test(contrasena)) {
      throw { status: 400, message: 'La contraseña debe tener al menos una minúscula' };
    }
    if (!/[0-9]/.test(contrasena)) {
      throw { status: 400, message: 'La contraseña debe tener al menos un número' };
    }
  }

  /**
   * Comprueba la confirmación de contraseña ANTES de crear nada.
   *
   * Acepta los nombres que suelen mandar los formularios (`confirmar_contrasena`,
   * `confirmarContrasena`, `contrasena_confirmacion`, `confirmacion`) para no obligar al
   * frontend a un nombre concreto. La comparación es exacta: no se recortan espacios,
   * porque un espacio final forma parte de la contraseña y recortarlo aquí haría que el
   * usuario guardara una contraseña distinta de la que escribió y luego no pudiera entrar.
   *
   * @param {string} contrasena
   * @param {Object} cuerpo - El body de la petición, de donde se extrae la confirmación.
   * @throws {Object} 400 si falta la confirmación o no coincide.
   */
  static validarConfirmacion(contrasena, cuerpo = {}) {
    const confirmacion = cuerpo.confirmar_contrasena
      ?? cuerpo.confirmarContrasena
      ?? cuerpo.contrasena_confirmacion
      ?? cuerpo.confirmacion;

    if (confirmacion === undefined || confirmacion === null || confirmacion === '') {
      throw { status: 400, message: 'Debes confirmar la contraseña (envía confirmar_contrasena)' };
    }
    if (confirmacion !== contrasena) {
      throw { status: 400, message: 'La contraseña y su confirmación no coinciden' };
    }
  }

  /**
   * Atajo para el alta de cuentas: valida fortaleza y confirmación de una sola vez.
   * @param {string} contrasena
   * @param {Object} cuerpo
   * @throws {Object} 400 si algo no cumple.
   */
  static validarNueva(contrasena, cuerpo = {}) {
    PasswordUtil.validarFortaleza(contrasena);
    PasswordUtil.validarConfirmacion(contrasena, cuerpo);
  }
}

module.exports = PasswordUtil;