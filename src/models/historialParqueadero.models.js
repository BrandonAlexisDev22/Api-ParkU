/**
 * @module HistorialParqueaderoModel
 * @description Modelo Sequelize para 'historial_parqueadero'. Se llena solo vía trigger
 * fn_historial_parqueadero en cada INSERT/UPDATE de parqueadero -- la API solo la lee.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const HistorialParqueadero = sequelize.define('HistorialParqueadero', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  parqueadero_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  accion: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  estado_anterior: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  estado_nuevo: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  motivo: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'historial_parqueadero',
  timestamps: false,
});

module.exports = HistorialParqueadero;
