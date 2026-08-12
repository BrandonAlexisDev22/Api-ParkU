/**
 * @module RecuperacionPasswordModel
 * @description Modelo Sequelize para 'recuperacion_password' (HU 02.2.3.2). Guarda el
 * token de recuperación de contraseña; no lleva trigger de auditoría a propósito
 * (debe funcionar sin sesión previa).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RecuperacionPassword = sequelize.define('RecuperacionPassword', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  token: {
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
  tableName: 'recuperacion_password',
  timestamps: false,
});

module.exports = RecuperacionPassword;
