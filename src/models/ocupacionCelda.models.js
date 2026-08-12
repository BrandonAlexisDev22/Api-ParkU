/**
 * @module OcupacionCeldaModel
 * @description Modelo Sequelize para 'ocupacion_celda'. Quién ocupa cada celda ahora
 * (estado=ACTIVA) y el histórico. Se llena sola desde registro_acceso vía trigger
 * (fn_registro_ingreso_celda / fn_registro_salida_celda) -- la API solo la lee.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OcupacionCelda = sequelize.define('OcupacionCelda', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  celda_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  vehiculo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  registro_acceso_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reserva_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  usuario_asigna_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fecha_hora_inicio: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fecha_hora_fin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('ACTIVA', 'FINALIZADA', 'CANCELADA'),
    allowNull: false,
    defaultValue: 'ACTIVA',
  },
}, {
  tableName: 'ocupacion_celda',
  timestamps: false,
});

module.exports = OcupacionCelda;
