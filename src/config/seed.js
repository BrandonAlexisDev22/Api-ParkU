/**
 * @module Seed
 * @description Espejo idempotente de la semilla que ya trae database/parku.postgres
 * (roles, módulos, permisos, rol_permiso, tipo_usuario y el usuario administrador),
 * pensado como red de seguridad si se corre contra un esquema vacío (solo DDL, sin los
 * INSERT del dump) o para regenerar el admin con una contraseña real. Usa findOrCreate,
 * así que puede ejecutarse varias veces sin duplicar registros.
 *
 * Uso: npm run seed
 */
require('dotenv').config();

const { sequelize, Rol, Modulo, Permiso, RolPermiso, TipoUsuario, Usuario } = require('../models');
const { ROLES } = require('./roles');
const PasswordUtil = require('../utils/password.util');

const ROLES_SEED = [
  { id: ROLES.ADMIN, nombre: 'Administrador', descripcion: 'Acceso completo al sistema' },
  { id: ROLES.VIGILANTE, nombre: 'Vigilante', descripcion: 'Personal de vigilancia' },
  { id: ROLES.CONDUCTOR, nombre: 'Conductor', descripcion: 'Usuario de la comunidad SENA' },
];

const MODULOS = [
  'Configuración', 'Usuarios', 'Parqueaderos', 'Control de Ingreso',
  'Control de Salida', 'Reservas', 'Novedades', 'Medición y Desempeño',
];

// Permisos agrupados por el módulo al que pertenecen (mismo orden que el dump SQL).
const PERMISOS_POR_MODULO = {
  'Configuración': ['configuracion.gestionar'],
  'Usuarios': ['usuarios.consultar', 'usuarios.gestionar'],
  'Parqueaderos': ['parqueaderos.consultar', 'parqueaderos.gestionar'],
  'Control de Ingreso': ['ingreso.consultar', 'ingreso.gestionar'],
  'Control de Salida': ['salida.consultar', 'salida.gestionar'],
  'Reservas': ['reservas.consultar', 'reservas.gestionar'],
  'Novedades': ['novedades.consultar', 'novedades.gestionar'],
  'Medición y Desempeño': ['reportes.consultar'],
};

// Vigilante: parqueaderos.consultar + todo *.consultar/*.gestionar de ingreso/salida/reservas/novedades.
const PERMISOS_VIGILANTE = [
  'parqueaderos.consultar',
  'ingreso.consultar', 'ingreso.gestionar',
  'salida.consultar', 'salida.gestionar',
  'reservas.consultar', 'reservas.gestionar',
  'novedades.consultar', 'novedades.gestionar',
];

// Conductor: solo lectura de lo que le compete.
const PERMISOS_CONDUCTOR = [
  'parqueaderos.consultar', 'ingreso.consultar', 'reservas.consultar', 'novedades.consultar',
];

const TIPOS_USUARIO = [
  { nombre: 'Aprendiz', descripcion: 'Aprendiz en formación activa' },
  { nombre: 'Instructor', descripcion: 'Instructor del centro de formación' },
  { nombre: 'Administrativo', descripcion: 'Personal administrativo' },
  { nombre: 'Contratista', descripcion: 'Personal contratista' },
  { nombre: 'Visitante', descripcion: 'Visitante sin vínculo laboral o de formación' },
];

const seedRoles = async () => {
  const roles = {};
  for (const r of ROLES_SEED) {
    const [rol] = await Rol.findOrCreate({ where: { nombre: r.nombre }, defaults: r });
    roles[r.nombre] = rol;
  }
  console.log(`✅ Roles sembrados (${ROLES_SEED.length})`);
  return roles;
};

const seedModulosYPermisos = async () => {
  const modulos = {};
  for (const nombre of MODULOS) {
    const [modulo] = await Modulo.findOrCreate({ where: { nombre } });
    modulos[nombre] = modulo;
  }

  const permisos = {};
  let totalPermisos = 0;
  for (const [moduloNombre, nombresPermiso] of Object.entries(PERMISOS_POR_MODULO)) {
    for (const nombre of nombresPermiso) {
      const [permiso] = await Permiso.findOrCreate({
        where: { modulo_id: modulos[moduloNombre].id, nombre },
      });
      permisos[nombre] = permiso;
      totalPermisos += 1;
    }
  }

  console.log(`✅ Módulos y permisos sembrados (${MODULOS.length} módulos, ${totalPermisos} permisos)`);
  return permisos;
};

const seedRolPermiso = async (roles, permisos) => {
  // Administrador: todos los permisos.
  for (const permiso of Object.values(permisos)) {
    await RolPermiso.findOrCreate({ where: { rol_id: roles['Administrador'].id, permiso_id: permiso.id } });
  }
  for (const nombre of PERMISOS_VIGILANTE) {
    await RolPermiso.findOrCreate({ where: { rol_id: roles['Vigilante'].id, permiso_id: permisos[nombre].id } });
  }
  for (const nombre of PERMISOS_CONDUCTOR) {
    await RolPermiso.findOrCreate({ where: { rol_id: roles['Conductor'].id, permiso_id: permisos[nombre].id } });
  }
  console.log('✅ Asignación rol-permiso sembrada');
};

const seedTiposUsuario = async () => {
  for (const t of TIPOS_USUARIO) {
    await TipoUsuario.findOrCreate({ where: { nombre: t.nombre }, defaults: t });
  }
  console.log(`✅ Tipos de usuario sembrados (${TIPOS_USUARIO.length})`);
};

const seedAdmin = async (roles) => {
  const correo = process.env.SEED_ADMIN_EMAIL || 'admin@parku.sena.edu.co';
  const contrasenaPlano = process.env.SEED_ADMIN_PASSWORD;

  const existente = await Usuario.findOne({ where: { correo } });

  if (!contrasenaPlano) {
    if (existente) {
      console.log(`ℹ️  Usuario admin ya existe (${correo}); defina SEED_ADMIN_PASSWORD si necesita regenerarlo`);
    } else {
      console.log('⚠️  SEED_ADMIN_PASSWORD no está definida: no se crea el usuario admin. Defínala y vuelva a correr el seed.');
    }
    return;
  }

  const contrasena = await PasswordUtil.hash(contrasenaPlano);

  if (existente) {
    await existente.update({ contrasena });
    console.log(`✅ Contraseña del admin actualizada (${correo})`);
    return;
  }

  await Usuario.create({
    nombre: 'Administrador ParkU',
    correo,
    contrasena,
    rol_id: roles['Administrador'].id,
    estado: 'ACTIVO',
  });
  console.log(`✅ Usuario admin creado: ${correo}`);
};

const seed = async () => {
  try {
    await sequelize.authenticate();
    const roles = await seedRoles();
    const permisos = await seedModulosYPermisos();
    await seedRolPermiso(roles, permisos);
    await seedTiposUsuario();
    await seedAdmin(roles);
    console.log('🌱 Seed completado correctamente');
  } catch (error) {
    console.error('❌ Error ejecutando el seed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  seed();
}

module.exports = { seed };
