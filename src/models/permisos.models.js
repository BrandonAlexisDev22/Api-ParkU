/**
 * @module PermisoModel
 * @description Modelo Sequelize para la tabla 'permiso'.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Permiso = sequelize.define('Permiso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'permiso',
  timestamps: false,
});

module.exports = Permiso;