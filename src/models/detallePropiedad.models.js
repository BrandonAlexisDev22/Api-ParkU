/**
 * @module DetallePropiedadModel
 * @description Modelo Sequelize para 'detalle_propiedad': relación M:N conductor-vehículo.
 * es_principal marca al propietario que se muestra en los listados; solo puede haber
 * un principal por vehículo (índice parcial uq_propietario_principal en la BD).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DetallePropiedad = sequelize.define('DetallePropiedad', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  conductor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  vehiculo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  es_principal: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'detalle_propiedad',
  timestamps: true,
  createdAt: 'fecha_registro',
  updatedAt: false,
  indexes: [
    { unique: true, fields: ['conductor_id', 'vehiculo_id'] },
  ],
});

module.exports = DetallePropiedad;
