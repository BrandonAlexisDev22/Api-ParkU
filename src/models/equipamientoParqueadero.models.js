/**
 * @module EquipamientoParqueaderoModel
 * @description Modelo Sequelize para 'equipamiento_parqueadero' (sensores, cámaras,
 * cargadores, barreras... instalados en cada parqueadero).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EquipamientoParqueadero = sequelize.define('EquipamientoParqueadero', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  parqueadero_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('SENSOR', 'CAMARA', 'CARGADOR_ELECTRICO', 'BARRERA', 'OTRO'),
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  codigo: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  ubicacion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  observaciones: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  fecha_instalacion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'equipamiento_parqueadero',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: false,
});

module.exports = EquipamientoParqueadero;
