/**
 * @module HistorialCeldaModel
 * @description Modelo Sequelize para 'historial_celda'. Se llena solo vía trigger
 * fn_historial_celda en cada INSERT/UPDATE de celda -- la API solo la lee.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const HistorialCelda = sequelize.define('HistorialCelda', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  celda_id: {
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
    type: DataTypes.ENUM('DISPONIBLE', 'OCUPADA', 'RESERVADA', 'MANTENIMIENTO', 'INACTIVA'),
    allowNull: true,
  },
  estado_nuevo: {
    type: DataTypes.ENUM('DISPONIBLE', 'OCUPADA', 'RESERVADA', 'MANTENIMIENTO', 'INACTIVA'),
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
  tableName: 'historial_celda',
  timestamps: false,
});

module.exports = HistorialCelda;
