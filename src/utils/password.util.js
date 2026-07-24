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
}

module.exports = PasswordUtil;