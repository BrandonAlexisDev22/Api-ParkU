/**
 * @module UsuarioModel
 * @description Modelo Sequelize para la tabla 'usuario'.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  correo: {
    type: DataTypes.CITEXT,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  nombre: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: "nombre"
  },
  contrasena: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'contrasena', // el nombre real de la columna en la BD
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 3, // 1=Vigilante, 2=Admin, 3=Conductor
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'usuario',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Usuario;
