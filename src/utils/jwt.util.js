const jwt = require('jsonwebtoken');
require('dotenv').config();

class JWTUtil {
  static SECRET = process.env.JWT_SECRET;
  static EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  static REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

  /**
   * Genera un token de acceso
   * @param {Object} payload - Datos a incluir en el token
   * @returns {string} - Token JWT
   */
  static generateToken(payload) {
    return jwt.sign(payload, this.SECRET, { expiresIn: this.EXPIRES_IN });
  }

  /**
   * Genera un refresh token
   * @param {Object} payload - Datos a incluir en el token
   * @returns {string} - Refresh token JWT
   */
  static generateRefreshToken(payload) {
    return jwt.sign(payload, this.SECRET, { expiresIn: this.REFRESH_EXPIRES_IN });
  }

  /**
   * Verifica un token JWT
   * @param {string} token - Token a verificar
   * @returns {Object} - Payload decodificado
   * @throws {Error} - Si el token es inválido o expirado
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, this.SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expirado');
      }
      throw new Error('Token inválido');
    }
  }

  /**
   * Decodifica un token sin verificar
   * @param {string} token - Token a decodificar
   * @returns {Object|null} - Payload decodificado
   */
  static decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JWTUtil;