/**
 * @module RegistroAccesoModel
 * @description Modelo Sequelize para la tabla 'registro_acceso' (reemplaza a la vieja
 * ingreso_salida). Un solo registro cubre ingreso y salida: fecha_hora_salida NULL
 * significa que el vehículo sigue adentro. Los triggers de la BD se encargan de
 * ocupar/liberar la celda (fn_registro_ingreso_celda / fn_registro_salida_celda).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RegistroAcceso = sequelize.define('RegistroAcceso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  vehiculo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  conductor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  parqueadero_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  celda_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reserva_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  usuario_ingreso_id: {
    // Vigilante que registró la entrada.
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  usuario_salida_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fecha_hora_ingreso: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fecha_hora_salida: {
    // NULL = el vehículo sigue adentro.
    type: DataTypes.DATE,
    allowNull: true,
  },
  descripcion_ingreso: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  descripcion_salida: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('DENTRO', 'FINALIZADO', 'BLOQUEADO'),
    allowNull: false,
    defaultValue: 'DENTRO',
  },
  es_oficial_sena: {
    // Ingreso oficial SENA (vehículo institucional/en comisión): exento de la revisión
    // por estadía prolongada (> 16h) -- ver monitoreo.service.js.
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'registro_acceso',
  timestamps: false,
});

module.exports = RegistroAcceso;
