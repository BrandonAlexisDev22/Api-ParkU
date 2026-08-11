/**
 * @module RolModel
 * @description Modelo Sequelize para la tabla 'rol'.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Rol = sequelize.define('Rol', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(50),
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
  tableName: 'rol',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: false,
});

module.exports = Rol;
