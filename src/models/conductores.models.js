/**
 * @module ConductorModel
 * @description Modelo Sequelize para la tabla 'conductor'.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conductor = sequelize.define('Conductor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tipo_documento: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'CC',
  },
  numero_documento: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  nombre_apellidos: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  correo: {
    type: DataTypes.CITEXT,
    allowNull: true,
    unique: true,
    validate: { isEmail: true },
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  numero_telefonico: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  tipo_usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  regional_formacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  centro_formacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  programa_formacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  vigencia: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'conductor',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['tipo_documento', 'numero_documento'] },
  ],
});

module.exports = Conductor;
