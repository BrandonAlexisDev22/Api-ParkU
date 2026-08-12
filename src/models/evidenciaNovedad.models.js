/**
 * @module EvidenciaNovedadModel
 * @description Modelo Sequelize para 'evidencia_novedad': archivos adjuntos (fotos,
 * video, documentos, notas) de una novedad. Una novedad puede tener varias.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EvidenciaNovedad = sequelize.define('EvidenciaNovedad', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  novedad_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('FOTO', 'VIDEO', 'DOCUMENTO', 'NOTA'),
    allowNull: false,
    defaultValue: 'FOTO',
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'evidencia_novedad',
  timestamps: false,
});

module.exports = EvidenciaNovedad;
