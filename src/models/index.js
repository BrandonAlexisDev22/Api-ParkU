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
const Conductor = require('./conductores.models');
const TipoUsuario = require('./tipoUsuario.models');
const RegionalFormacion = require('./regionalFormacion.models');
const CentroFormacion = require('./centroFormacion.models');
const ProgramaFormacion = require('./programaFormacion.models');

// ============================================
// RELACIONES: Parqueadero - Celda
// ============================================

// Una celda pertenece a un parqueadero (FK: celda.parqueadero_id -> parqueadero.id)
Celda.belongsTo(Parqueadero, {
  foreignKey: 'parqueadero',
  as: 'Parqueadero',
});

// Un parqueadero tiene muchas celdas
Parqueadero.hasMany(Celda, {
  foreignKey: 'parqueadero',
  as: 'celdas',
});

// ============================================
// RELACIONES: Usuario - Rol
// ============================================

// ✅ Un usuario pertenece a un rol (FK: usuario.rol_id -> rol.id)
Usuario.belongsTo(Rol, {
  foreignKey: 'rol_id',  // ✅ Nombre correcto de la columna en usuario
  as: 'rol',             // ✅ Alias para usar en include
});

// Un rol puede tener muchos usuarios (relación inversa - opcional)
Rol.hasMany(Usuario, {
  foreignKey: 'rol_id',
  as: 'usuarios',
});

// ============================================
// RELACIONES: Rol - Permiso (Muchos a Muchos)
// ============================================

// Un rol tiene muchos permisos, y un permiso puede estar en muchos roles
// (relación muchos-a-muchos a través de rol_permiso)
Rol.belongsToMany(Permiso, {
  through: RolPermiso,
  foreignKey: 'rol_id',
  otherKey: 'permiso_id',
  as: 'permisos',
});

Permiso.belongsToMany(Rol, {
  through: RolPermiso,
  foreignKey: 'permiso_id',
  otherKey: 'rol_id',
  as: 'roles',
});

// Asociaciones directas con la tabla intermedia (para poder hacer include
// de Rol/Permiso directamente sobre un registro de RolPermiso)
RolPermiso.belongsTo(Rol, { foreignKey: 'rol_id', as: 'Rol' });
RolPermiso.belongsTo(Permiso, { foreignKey: 'permiso_id', as: 'Permiso' });

// ============================================
// RELACIONES: Conductor
// ============================================

// Un conductor puede estar vinculado opcionalmente a una cuenta de usuario
Conductor.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario',
});

Conductor.belongsTo(TipoUsuario, {
  foreignKey: 'tipo_usuario_id',
  as: 'tipoUsuario',
});

Conductor.belongsTo(RegionalFormacion, {
  foreignKey: 'regional_formacion_id',
  as: 'regionalFormacion',
});

Conductor.belongsTo(CentroFormacion, {
  foreignKey: 'centro_formacion_id',
  as: 'centroFormacion',
});

Conductor.belongsTo(ProgramaFormacion, {
  foreignKey: 'programa_formacion_id',
  as: 'programaFormacion',
});

// Un centro de formación pertenece a una regional de formación
CentroFormacion.belongsTo(RegionalFormacion, {
  foreignKey: 'regional_formacion_id',
  as: 'regionalFormacion',
});

RegionalFormacion.hasMany(CentroFormacion, {
  foreignKey: 'regional_formacion_id',
  as: 'centrosFormacion',
});

module.exports = {
  sequelize,
  Celda,
  Parqueadero,
  Usuario,
  Rol,
  Permiso,
  RolPermiso,
  Conductor,
  TipoUsuario,
  RegionalFormacion,
  CentroFormacion,
  ProgramaFormacion,
};
