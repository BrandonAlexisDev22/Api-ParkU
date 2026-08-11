/**
 * @module VehiculoModel
 * @description Modelo Sequelize para la tabla 'vehiculo' (Proceso 04.2).
 * Ya no tiene FK directa a conductor: la propiedad se modela con la tabla
 * 'detalle_propiedad' (relación M:N conductor-vehículo, ver detallePropiedad.models.js).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vehiculo = sequelize.define('Vehiculo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  placa: {
    // Nullable: las bicicletas pueden no tener placa (ck_vehiculo_placa_por_tipo).
    type: DataTypes.STRING(10),
    allowNull: true,
    unique: true,
  },
  tipo: {
    type: DataTypes.ENUM('CARRO', 'MOTO', 'BICICLETA', 'CAMION', 'BUS'),
    allowNull: false,
  },
  tarjeta_propiedad: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  marca: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  linea: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  modelo: {
    // Año del vehículo.
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  cilindraje: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  servicio: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  carroceria: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  combustible: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  capacidad: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  numero_motor: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  numero_chasis: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  observaciones: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  vehiculo_sena: {
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
  tableName: 'vehiculo',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: false,
});

module.exports = Vehiculo;
