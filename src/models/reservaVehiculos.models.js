/**
 * @module ReservaModel
 * @description Modelo Sequelize para la tabla 'reserva' (Proceso 06.1).
 * La BD valida solapamientos de horario y bloquea/libera la celda sola vía triggers;
 * este modelo solo declara la forma de la fila.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Reserva = sequelize.define('Reserva', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tipo_reserva: {
    type: DataTypes.ENUM('VEHICULO_SENA', 'MOVILIDAD_REDUCIDA', 'VISITANTE'),
    allowNull: false,
  },
  celda_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  usuario_registra_id: {
    // Vigilante que registra la reserva en el sistema (quién crea, no para quién es).
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  conductor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  vehiculo_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  motivo: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  fecha_hora_inicio: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  fecha_hora_fin: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'TERMINADA', 'CANCELADA'),
    allowNull: false,
    defaultValue: 'PENDIENTE',
  },
  usuario_gestiona_id: {
    // Quién aprueba o rechaza.
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'reserva',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: false,
});

module.exports = Reserva;
