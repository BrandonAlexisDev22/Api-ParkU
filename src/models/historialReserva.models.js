/**
 * @module HistorialReservaModel
 * @description Modelo Sequelize para 'historial_reserva'. Se llena solo vía trigger
 * fn_historial_reserva en cada INSERT/UPDATE de reserva -- la API solo la lee.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const HistorialReserva = sequelize.define('HistorialReserva', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  reserva_id: {
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
    type: DataTypes.ENUM('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'TERMINADA', 'CANCELADA'),
    allowNull: true,
  },
  estado_nuevo: {
    type: DataTypes.ENUM('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'TERMINADA', 'CANCELADA'),
    allowNull: true,
  },
  fecha_inicio_anterior: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_inicio_nueva: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_fin_anterior: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_fin_nueva: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  celda_anterior_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  celda_nueva_id: {
    type: DataTypes.INTEGER,
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
  tableName: 'historial_reserva',
  timestamps: false,
});

module.exports = HistorialReserva;
