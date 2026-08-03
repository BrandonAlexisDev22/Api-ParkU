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
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "nombre"
  },
  contrasena: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'contrasena', // el nombre real de la columna en la BD
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3, // 1=Admin, 2=Supervisor, 3=Usuario
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  // refresh_token: {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  // },
}, {
  tableName: 'usuario',
  timestamps: false,
});

module.exports = Usuario;