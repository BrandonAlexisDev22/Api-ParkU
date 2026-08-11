/**
 * @module TipoUsuarioModel
 * @description Modelo Sequelize para la tabla 'tipo_usuario' (catálogo).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TipoUsuario = sequelize.define('TipoUsuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'tipo_usuario',
  timestamps: false,
});

module.exports = TipoUsuario;
