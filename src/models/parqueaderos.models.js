/**
 * @module ParqueaderoModel
 * @description
 * Modelo Sequelize que representa la entidad Parqueadero dentro del sistema ParkU.
 * Sincronizado con la tabla 'parqueadero' de la base de datos.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Parqueadero = sequelize.define('Parqueadero', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  ubicacion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true, // TRUE = Activo, FALSE = Inactivo
  },
}, {
  tableName: 'parqueadero',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Parqueadero;
