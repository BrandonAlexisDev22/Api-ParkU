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
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  ubicacion: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  acceso: {
    type: DataTypes.ENUM('REGIONAL', 'AVENIDA_BOYACA'),
    allowNull: false,
  },
  capacidad_maxima: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  hora_apertura: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  hora_cierre: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true, // TRUE = Activo, FALSE = Inactivo
  },
  zona: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  piso: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  plano_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  observaciones: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  tipo: {
    type: DataTypes.ENUM('GENERAL', 'DOCENTES', 'ADMINISTRATIVOS', 'APRENDICES', 'VISITANTES', 'MOTOS', 'VEHICULO_SENA'),
    allowNull: false,
    defaultValue: 'GENERAL',
  },
}, {
  tableName: 'parqueadero',
  timestamps: false,
});

module.exports = Parqueadero;
