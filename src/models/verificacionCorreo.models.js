/**
 * @module VerificacionCorreoModel
 * @description Modelo Sequelize para 'verificacion_correo'. Guarda el HASH (SHA-256) del
 * token de verificación de correo, nunca el token en claro -- ver
 * verificacionCorreo.service.js. Mismo patrón que 'recuperacion_password': no lleva
 * trigger de auditoría a propósito (debe poder usarse recién creada la cuenta, antes de
 * cualquier sesión).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VerificacionCorreo = sequelize.define('VerificacionCorreo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  token_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  fecha_solicitud: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fecha_expiracion: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  usado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'verificacion_correo',
  timestamps: false,
});

module.exports = VerificacionCorreo;
