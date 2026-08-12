/**
 * @module HistorialDisponibilidadCeldaModel
 * @description Modelo Sequelize para 'historial_disponibilidad_celda'. Se llena solo
 * vía trigger fn_sincronizar_disponibilidad cada vez que se escribe en
 * disponibilidad_celda -- la API solo la lee.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const HistorialDisponibilidadCelda = sequelize.define('HistorialDisponibilidadCelda', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  celda_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  estado_anterior: {
    type: DataTypes.ENUM('DISPONIBLE', 'OCUPADA', 'RESERVADA', 'MANTENIMIENTO', 'INACTIVA'),
    allowNull: true,
  },
  estado_nuevo: {
    type: DataTypes.ENUM('DISPONIBLE', 'OCUPADA', 'RESERVADA', 'MANTENIMIENTO', 'INACTIVA'),
    allowNull: false,
  },
  motivo: {
    type: DataTypes.ENUM(
      'INGRESO_VEHICULO', 'SALIDA_VEHICULO', 'RESERVA', 'LIBERACION_RESERVA',
      'MANTENIMIENTO', 'DANIO', 'ERROR_ASIGNACION', 'AJUSTE_OPERATIVO', 'OTRO',
    ),
    allowNull: false,
  },
  observacion: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'historial_disponibilidad_celda',
  timestamps: false,
});

module.exports = HistorialDisponibilidadCelda;
