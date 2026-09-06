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
  /* Un INCIDENTE es un daño, un choque o una problemática: ocurre sobre algo concreto y
     necesita tipo y prioridad para poder atenderlo. Una NOVEDAD es una observación de la
     operación, sin gravedad: no tiene celda ni vehículo detrás, y exigirle tipo y prioridad
     solo obligaba a inventar datos. Ver la migración 007. */
  clase: {
    type: DataTypes.ENUM('INCIDENTE', 'NOVEDAD'),
    allowNull: false,
    defaultValue: 'INCIDENTE',
  },
  tipo_novedad: {
    // NULL en una NOVEDAD: no tiene tipo. Para un INCIDENTE lo exige el servicio.
    type: DataTypes.ENUM('DANIO', 'ACCIDENTE', 'MAL_ESTACIONAMIENTO', 'QUEJA', 'OTRO'),
    allowNull: true,
  },
  /** En qué consiste, cuando el tipo es OTRO. */
  tipo_otro: {
    type: DataTypes.STRING(100),
    allowNull: true,
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
