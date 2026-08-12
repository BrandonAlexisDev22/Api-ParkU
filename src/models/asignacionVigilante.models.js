/**
 * @module AsignacionVigilanteModel
 * @description Modelo Sequelize para 'asignacion_vigilante': turnos y parqueaderos
 * asignados a cada vigilante.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AsignacionVigilante = sequelize.define('AsignacionVigilante', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  parqueadero_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  turno: {
    type: DataTypes.ENUM('MANANA', 'TARDE', 'NOCHE'),
    allowNull: false,
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  hora_inicio: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  hora_fin: {
    type: DataTypes.TIME,
    allowNull: true,
  },
}, {
  tableName: 'asignacion_vigilante',
  timestamps: false,
});

module.exports = AsignacionVigilante;
