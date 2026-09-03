/**
 * @module NovedadModel
 * @description Modelo Sequelize para la tabla 'novedad' (Proceso 07.1, singular en la BD).
 * usuario_reporta_id reemplaza al viejo campo de texto libre 'encargado'.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Novedad = sequelize.define('Novedad', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tipo_novedad: {
    type: DataTypes.ENUM('DANIO', 'ACCIDENTE', 'MAL_ESTACIONAMIENTO', 'QUEJA', 'OTRO'),
    allowNull: false,
  },
  prioridad: {
    // NULL mientras el reporte sigue PENDIENTE: Comunidad SENA no elige prioridad, la
    // define el personal autorizado al aceptarlo (ver novedades.service.js aceptar()).
    type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA', 'CRITICA'),
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'CERRADA', 'CANCELADA'),
    allowNull: false,
    defaultValue: 'PENDIENTE',
  },
  descripcion: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  usuario_reporta_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  usuario_asignado_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  vehiculo_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  celda_id: {
    // La "ubicación" de la novedad.
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  parqueadero_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  registro_acceso_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fecha_hora_cierre: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  justificacion_cierre: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'novedad',
  timestamps: false,
});

module.exports = Novedad;
