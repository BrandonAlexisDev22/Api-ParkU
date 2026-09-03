/**
 * @module ModelsIndex
 * @description Centraliza los modelos Sequelize y define sus asociaciones,
 * alineadas con database/parku.postgres.
 */

const { sequelize } = require('../config/database');
const Celda = require('./celdas.models');
const Parqueadero = require('./parqueaderos.models');
const Usuario = require('./usuarios.models');
const Rol = require('./roles.models');
const Permiso = require('./permisos.models');
const RolPermiso = require('./rolPermiso.models');
const Modulo = require('./modulo.models');
const Conductor = require('./conductores.models');
const TipoUsuario = require('./tipoUsuario.models');
const Vehiculo = require('./vehiculos.models');
const DetallePropiedad = require('./detallePropiedad.models');
const Reserva = require('./reservaVehiculos.models');
const RegistroAcceso = require('./control-salidas.models');
const Novedad = require('./novedades.models');
const Notificacion = require('./notificacion.models');
const OcupacionCelda = require('./ocupacionCelda.models');
const DisponibilidadCelda = require('./disponibilidadCelda.models');
const HistorialCelda = require('./historialCelda.models');
const HistorialParqueadero = require('./historialParqueadero.models');
const HistorialReserva = require('./historialReserva.models');
const HistorialNovedad = require('./historialNovedad.models');
const HistorialDisponibilidadCelda = require('./historialDisponibilidadCelda.models');
const Auditoria = require('./auditoria.models');
const EquipamientoParqueadero = require('./equipamientoParqueadero.models');
const EvidenciaNovedad = require('./evidenciaNovedad.models');
const RecuperacionPassword = require('./recuperacionPassword.models');
const VerificacionCorreo = require('./verificacionCorreo.models');
const AsignacionVigilante = require('./asignacionVigilante.models');

// ============================================
// RELACIONES: Usuario - Rol
// ============================================

Usuario.belongsTo(Rol, { foreignKey: 'rol_id', as: 'rol' });
Rol.hasMany(Usuario, { foreignKey: 'rol_id', as: 'usuarios' });

// ============================================
// RELACIONES: Rol - Permiso (Muchos a Muchos) y Permiso - Modulo
// ============================================

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
RolPermiso.belongsTo(Rol, { foreignKey: 'rol_id', as: 'Rol' });
RolPermiso.belongsTo(Permiso, { foreignKey: 'permiso_id', as: 'Permiso' });

Permiso.belongsTo(Modulo, { foreignKey: 'modulo_id', as: 'modulo' });
Modulo.hasMany(Permiso, { foreignKey: 'modulo_id', as: 'permisos' });

// ============================================
// RELACIONES: Conductor
// ============================================

Conductor.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasOne(Conductor, { foreignKey: 'usuario_id', as: 'conductor' });

Conductor.belongsTo(TipoUsuario, { foreignKey: 'tipo_usuario_id', as: 'tipoUsuario' });

// ============================================
// RELACIONES: Parqueadero - Celda
// ============================================

Celda.belongsTo(Parqueadero, { foreignKey: 'parqueadero', as: 'Parqueadero' });
Parqueadero.hasMany(Celda, { foreignKey: 'parqueadero', as: 'celdas' });

// ============================================
// RELACIONES: Vehiculo - Conductor (M:N vía detalle_propiedad)
// ============================================

DetallePropiedad.belongsTo(Conductor, { foreignKey: 'conductor_id', as: 'conductor' });
DetallePropiedad.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id', as: 'vehiculo' });
Conductor.hasMany(DetallePropiedad, { foreignKey: 'conductor_id', as: 'propiedades' });
Vehiculo.hasMany(DetallePropiedad, { foreignKey: 'vehiculo_id', as: 'propietarios' });

Conductor.belongsToMany(Vehiculo, {
  through: DetallePropiedad,
  foreignKey: 'conductor_id',
  otherKey: 'vehiculo_id',
  as: 'vehiculos',
});
Vehiculo.belongsToMany(Conductor, {
  through: DetallePropiedad,
  foreignKey: 'vehiculo_id',
  otherKey: 'conductor_id',
  as: 'conductores',
});

// ============================================
// RELACIONES: Reserva
// ============================================

Reserva.belongsTo(Celda, { foreignKey: 'celda_id', as: 'celda' });
Reserva.belongsTo(Usuario, { foreignKey: 'usuario_registra_id', as: 'usuarioRegistra' });
Reserva.belongsTo(Usuario, { foreignKey: 'usuario_gestiona_id', as: 'gestionadoPor' });
Reserva.belongsTo(Conductor, { foreignKey: 'conductor_id', as: 'conductor' });
Reserva.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id', as: 'vehiculo' });

// ============================================
// RELACIONES: RegistroAcceso (ingresos/salidas)
// ============================================

RegistroAcceso.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id', as: 'vehiculo' });
RegistroAcceso.belongsTo(Conductor, { foreignKey: 'conductor_id', as: 'conductor' });
RegistroAcceso.belongsTo(Parqueadero, { foreignKey: 'parqueadero_id', as: 'parqueadero' });
RegistroAcceso.belongsTo(Celda, { foreignKey: 'celda_id', as: 'celda' });
RegistroAcceso.belongsTo(Reserva, { foreignKey: 'reserva_id', as: 'reserva' });
RegistroAcceso.belongsTo(Usuario, { foreignKey: 'usuario_ingreso_id', as: 'usuarioIngreso' });
RegistroAcceso.belongsTo(Usuario, { foreignKey: 'usuario_salida_id', as: 'usuarioSalida' });

// ============================================
// RELACIONES: Novedad
// ============================================

Novedad.belongsTo(Usuario, { foreignKey: 'usuario_reporta_id', as: 'reportadoPor' });
Novedad.belongsTo(Usuario, { foreignKey: 'usuario_asignado_id', as: 'asignadoA' });
Novedad.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id', as: 'vehiculo' });
Novedad.belongsTo(Celda, { foreignKey: 'celda_id', as: 'celda' });
Novedad.belongsTo(Parqueadero, { foreignKey: 'parqueadero_id', as: 'parqueadero' });
Novedad.belongsTo(RegistroAcceso, { foreignKey: 'registro_acceso_id', as: 'registroAcceso' });

// ============================================
// RELACIONES: Notificacion
// ============================================

Notificacion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// ============================================
// RELACIONES: OcupacionCelda (quién ocupa cada celda ahora e histórico)
// ============================================

OcupacionCelda.belongsTo(Celda, { foreignKey: 'celda_id', as: 'celda' });
OcupacionCelda.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id', as: 'vehiculo' });
OcupacionCelda.belongsTo(Usuario, { foreignKey: 'usuario_asigna_id', as: 'usuarioAsigna' });

// ============================================
// RELACIONES: DisponibilidadCelda / HistorialDisponibilidadCelda
// ============================================

DisponibilidadCelda.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
HistorialDisponibilidadCelda.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// ============================================
// RELACIONES: Historiales (celda, parqueadero, reserva, novedad)
// ============================================

HistorialCelda.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
HistorialParqueadero.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
HistorialReserva.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
HistorialNovedad.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// ============================================
// RELACIONES: Auditoria
// ============================================

Auditoria.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// ============================================
// RELACIONES: AsignacionVigilante
// ============================================

AsignacionVigilante.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
AsignacionVigilante.belongsTo(Parqueadero, { foreignKey: 'parqueadero_id', as: 'parqueadero' });

module.exports = {
  sequelize,
  Celda,
  Parqueadero,
  Usuario,
  Rol,
  Permiso,
  RolPermiso,
  Modulo,
  Conductor,
  TipoUsuario,
  Vehiculo,
  DetallePropiedad,
  Reserva,
  RegistroAcceso,
  Novedad,
  Notificacion,
  OcupacionCelda,
  DisponibilidadCelda,
  HistorialCelda,
  HistorialParqueadero,
  HistorialReserva,
  HistorialNovedad,
  HistorialDisponibilidadCelda,
  Auditoria,
  EquipamientoParqueadero,
  EvidenciaNovedad,
  RecuperacionPassword,
  VerificacionCorreo,
  AsignacionVigilante,
};
