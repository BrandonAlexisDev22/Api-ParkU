/**
 * @module UsuarioModel
 * @description Modelo Sequelize para la tabla 'usuario' (Proceso 02.1 en database/parku.postgres).
 * No tiene columna refresh_token: los refresh tokens son JWT sin estado (ver auth.controller.js).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { ROLES } = require('../config/roles');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  correo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  contrasena: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: ROLES.CONDUCTOR,
  },
  estado: {
    type: DataTypes.ENUM('ACTIVO', 'INACTIVO', 'BLOQUEADO'),
    allowNull: false,
    defaultValue: 'ACTIVO',
  },
  numero_telefonico: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  intentos_fallidos: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    defaultValue: 0,
  },
  ultimo_acceso: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  foto_perfil_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  correo_verificado: {
    // Distinto de "formato de correo válido": esto significa que el usuario efectivamente
    // recibió y abrió un enlace de verificación -- ver verificacionCorreo.service.js.
    // Las cuentas que ya existían antes de esta columna se marcaron true por migración
    // (grandfathering); solo las cuentas nuevas nacen en false.
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  fecha_cambio_contrasena: {
    // NULL = nunca cambió su contraseña desde que existe esta columna. Se usa para
    // invalidar JWT emitidos antes del último cambio -- ver auth.middleware.js.
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'usuario',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: 'fecha_modificacion',
});

module.exports = Usuario;
