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
    type: DataTypes.STRING,
    allowNull: false,
  },
  ubicacion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  celdas_totales: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  celdas_movilidad_reducida: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  celdas_motos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  celdas_carros: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true, // TRUE = Activo, FALSE = Inactivo
  },
}, {
  tableName: 'parqueadero',
  timestamps: false, // cambia a true si tu tabla tiene created_at/updated_at
});

module.exports = Parqueadero;