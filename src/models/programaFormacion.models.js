/**
 * @module ProgramaFormacionModel
 * @description Modelo Sequelize para la tabla 'programa_formacion' (catálogo).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProgramaFormacion = sequelize.define('ProgramaFormacion', {
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
  tableName: 'programa_formacion',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ProgramaFormacion;
