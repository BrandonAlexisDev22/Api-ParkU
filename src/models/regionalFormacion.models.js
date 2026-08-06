/**
 * @module RegionalFormacionModel
 * @description Modelo Sequelize para la tabla 'regional_formacion' (catálogo).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RegionalFormacion = sequelize.define('RegionalFormacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'regional_formacion',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = RegionalFormacion;
