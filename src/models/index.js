/**
 * @module ModelsIndex
 * @description Centraliza los modelos Sequelize y define sus asociaciones.
 */

const { sequelize } = require('../config/database');
const Celda = require('./celdas.models');
const Parqueadero = require('./parqueaderos.models');

// Una celda pertenece a un parqueadero (FK: celda.parqueadero -> parqueadero.id)
Celda.belongsTo(Parqueadero, {
  foreignKey: 'parqueadero',
  as: 'Parqueadero',
});

// Un parqueadero tiene muchas celdas
Parqueadero.hasMany(Celda, {
  foreignKey: 'parqueadero',
  as: 'celdas',
});

module.exports = {
  sequelize,
  Celda,
  Parqueadero,
};