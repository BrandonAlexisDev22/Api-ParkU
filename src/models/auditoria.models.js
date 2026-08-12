/**
 * @module AuditoriaModel
 * @description Modelo Sequelize para 'auditoria'. Se llena sola vía trigger
 * fn_auditoria_generica en cada escritura sobre celda, parqueadero, registro_acceso,
 * reserva y vehiculo -- la API solo la lee.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Auditoria = sequelize.define('Auditoria', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  tabla_afectada: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  registro_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  accion: {
    type: DataTypes.ENUM('CREAR', 'EDITAR', 'CAMBIAR_ESTADO', 'ELIMINAR', 'CONSULTAR'),
    allowNull: false,
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
  motivo: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  valor_anterior: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  valor_nuevo: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: 'auditoria',
  timestamps: false,
});

module.exports = Auditoria;
