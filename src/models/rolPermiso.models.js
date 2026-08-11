/**
 * @module RolPermisoModel
 * @description Modelo Sequelize para la tabla intermedia 'rol_permiso'
 * (relación muchos-a-muchos entre Rol y Permiso).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RolPermiso = sequelize.define('RolPermiso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  permiso_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'rol_permiso',
  timestamps: true,
  createdAt: 'fecha_asignacion',
  updatedAt: false,
  indexes: [
    { unique: true, fields: ['rol_id', 'permiso_id'] },
  ],
});

module.exports = RolPermiso;
