/**
 * @module ModuloModel
 * @description Modelo Sequelize para la tabla 'modulo' (catálogo). Agrupa los permisos
 * por área funcional (Usuarios, Parqueaderos, Reservas, etc.), FK obligatoria en 'permiso'.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Modulo = sequelize.define('Modulo', {
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
  tableName: 'modulo',
  timestamps: false,
});

module.exports = Modulo;
