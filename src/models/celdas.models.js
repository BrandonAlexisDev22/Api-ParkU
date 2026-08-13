/**
 * @module CeldaModel
 * @description Modelo Sequelize para la tabla 'celda' (Proceso 03.2).
 * celda.estado es la ÚNICA fuente de verdad de si una celda está libre: la mueven
 * el ingreso/salida de vehículos, la aceptación de reservas y los triggers de la BD.
 * No inferir disponibilidad desde ocupacion_celda ni disponibilidad_celda.
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Celda = sequelize.define('Celda', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  parqueadero: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'parqueadero_id',
  },
  numero: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('CARRO', 'MOTO', 'BICICLETA', 'CAMION', 'BUS'),
    allowNull: false,
  },
  usabilidad: {
    type: DataTypes.ENUM('GENERAL', 'EJECUTIVO', 'MOVILIDAD_REDUCIDA', 'VEHICULO_SENA'),
    allowNull: false,
    defaultValue: 'GENERAL',
  },
  estado: {
    type: DataTypes.ENUM('DISPONIBLE', 'OCUPADA', 'RESERVADA', 'MANTENIMIENTO', 'INACTIVA'),
    allowNull: false,
    defaultValue: 'DISPONIBLE',
  },
  observaciones: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  posicion_x: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  posicion_y: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  ancho: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  alto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
}, {
  tableName: 'celda',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['parqueadero_id', 'numero'] },
  ],
});

module.exports = Celda;