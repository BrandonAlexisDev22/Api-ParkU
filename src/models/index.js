/**
 * @module ModelsIndex
 * @description Centraliza los modelos Sequelize y define sus asociaciones.
 */

const { sequelize } = require('../config/database');
const Celda = require('./celdas.models');
const Parqueadero = require('./parqueaderos.models');
const Usuario = require('./usuarios.models');
const Rol = require('./roles.models');
const Permiso = require('./permisos.models');
const RolPermiso = require('./rolPermiso.models');

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

// Un rol tiene muchos permisos, y un permiso puede estar en muchos roles
// (relación muchos-a-muchos a través de rol_permiso)
Rol.belongsToMany(Permiso, {
  through: RolPermiso,
  foreignKey: 'rol',
  otherKey: 'permiso',
  as: 'permisos',
});

Permiso.belongsToMany(Rol, {
  through: RolPermiso,
  foreignKey: 'permiso',
  otherKey: 'rol',
  as: 'roles',
});

module.exports = {
  sequelize,
  Celda,
  Parqueadero,
  Usuario,
  Rol,
  Permiso,
  RolPermiso,
};