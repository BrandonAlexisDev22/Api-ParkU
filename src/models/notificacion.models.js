/**
 * @module NotificacionModel
 * @description Modelo Sequelize para la tabla 'notificacion'. Se llena sola vía
 * fn_notificar_administradores() cuando cambian novedades o reservas; la API solo
 * necesita leerlas y marcarlas como leídas.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notificacion = sequelize.define('Notificacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario_id: {
    // Destinatario.
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  titulo: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  mensaje: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('NOVEDAD', 'RESERVA', 'CAMBIO_ESTADO', 'ALERTA', 'ACCESO'),
    allowNull: false,
  },
  referencia_tabla: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  referencia_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  leida: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'notificacion',
  timestamps: false,
});

module.exports = Notificacion;
