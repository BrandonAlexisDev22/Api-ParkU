/**
 * @module RolPermisoModel
 * @description Modelo Sequelize para la tabla intermedia 'rol_permiso'
 * (relación muchos-a-muchos entre Rol y Permiso).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RolPermiso = sequelize.define('RolPermiso', {
  rol: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  permiso: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
}, {
  tableName: 'rol_permiso',
  timestamps: false,
});

module.exports = RolPermiso;