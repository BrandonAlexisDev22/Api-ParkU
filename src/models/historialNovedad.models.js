/**
 * @module HistorialNovedadModel
 * @description Modelo Sequelize para 'historial_novedad'. Se llena solo vía trigger
 * fn_historial_novedad en cada INSERT/UPDATE de novedad -- la API solo la lee.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const HistorialNovedad = sequelize.define('HistorialNovedad', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  novedad_id: {
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
    type: DataTypes.ENUM('PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'CERRADA', 'CANCELADA'),
    allowNull: true,
  },
  estado_nuevo: {
    type: DataTypes.ENUM('PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'CERRADA', 'CANCELADA'),
    allowNull: true,
  },
  prioridad_anterior: {
    type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA', 'CRITICA'),
    allowNull: true,
  },
  prioridad_nueva: {
    type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA', 'CRITICA'),
    allowNull: true,
  },
  comentario: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'historial_novedad',
  timestamps: false,
});

module.exports = HistorialNovedad;
