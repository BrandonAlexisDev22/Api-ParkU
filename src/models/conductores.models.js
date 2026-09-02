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
    // NULL = conductor registrado por vigilancia, sin cuenta propia.
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
  },
  tipo_documento: {
    type: DataTypes.ENUM('CC', 'CE', 'TI', 'PASAPORTE', 'PEP', 'NIT'),
    allowNull: false,
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
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: { isEmail: true },
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  numero_telefonico: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  tipo_usuario_id: {
    // Nullable: un conductor creado automáticamente al capturar el documento en el
    // registro público o en la creación admin de usuario (ver usuario.service.js /
    // auth.controller.js) todavía no tiene este catálogo -- lo completa después un
    // admin/vigilante vía PUT /api/conductores/:id. Sigue siendo obligatorio en el alta
    // administrativa completa (POST /api/conductores, ver conductor.service.js).
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // Datos de SOFIA Plus: texto libre, ya no son catálogos con FK propia.
  regional_formacion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  centro_formacion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  programa_formacion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  vigencia: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  movilidad_reducida: {
    // Habilita reservas tipo MOVILIDAD_REDUCIDA.
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  tipo_discapacidad: {
    // Detalle de la condición. Solo aplica cuando movilidad_reducida = true.
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'conductor',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: false,
  indexes: [
    { unique: true, fields: ['tipo_documento', 'numero_documento'] },
  ],
});

module.exports = Conductor;
