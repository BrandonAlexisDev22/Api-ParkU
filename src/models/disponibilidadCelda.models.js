/**
 * @module DisponibilidadCeldaModel
 * @description Modelo Sequelize para 'disponibilidad_celda': bitácora del ÚLTIMO cambio
 * MANUAL de disponibilidad de cada celda (mantenimiento, inactivación, reactivación...).
 * celda_id es UNIQUE -- una fila vigente por celda. El trigger fn_sincronizar_disponibilidad
 * copia el cambio a celda.estado y deja rastro en historial_disponibilidad_celda; exige
 * SET LOCAL app.usuario_id y app.motivo_disponibilidad (ver dbContext.util.js).
 * No refleja la ocupación por vehículos (eso es ocupacion_celda).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DisponibilidadCelda = sequelize.define('DisponibilidadCelda', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  celda_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  estado: {
    type: DataTypes.ENUM('DISPONIBLE', 'OCUPADA', 'RESERVADA', 'MANTENIMIENTO', 'INACTIVA'),
    allowNull: false,
  },
  motivo: {
    type: DataTypes.ENUM(
      'INGRESO_VEHICULO', 'SALIDA_VEHICULO', 'RESERVA', 'LIBERACION_RESERVA',
      'MANTENIMIENTO', 'DANIO', 'ERROR_ASIGNACION', 'AJUSTE_OPERATIVO', 'OTRO',
    ),
    allowNull: false,
  },
  observacion: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'disponibilidad_celda',
  timestamps: false,
});

module.exports = DisponibilidadCelda;
