/**
 * @module Seed
 * @description Script de datos semilla (roles, permisos y catálogos base) para
 * poblar una base de datos nueva. Es idempotente: usa findOrCreate, por lo que
 * puede ejecutarse varias veces sin duplicar registros.
 *
 * Uso: npm run seed
 */
require('dotenv').config();

const { sequelize, Rol, Permiso, RolPermiso, TipoUsuario, RegionalFormacion, CentroFormacion, ProgramaFormacion, Usuario } = require('../models');
const PasswordUtil = require('../utils/password.util');

const ROLES = [
  { id: 1, nombre: 'Vigilante' },
  { id: 2, nombre: 'Admin' },
  { id: 3, nombre: 'Conductor' },
];

const PERMISOS = [
  'gestionar_usuarios',
  'gestionar_roles',
  'gestionar_parqueaderos',
  'gestionar_celdas',
  'gestionar_conductores',
  'gestionar_vehiculos',
  'gestionar_reservas',
  'gestionar_entradas_salidas',
  'gestionar_novedades',
];

// Permisos que además del Admin (que recibe todos) tiene el rol Vigilante
const PERMISOS_VIGILANTE = [
  'gestionar_celdas',
  'gestionar_entradas_salidas',
  'gestionar_novedades',
];

const TIPOS_USUARIO = [
  { tipo_usuario: 'Aprendiz', descripcion: 'Aprendiz en formación activa' },
  { tipo_usuario: 'Instructor', descripcion: 'Instructor del centro de formación' },
  { tipo_usuario: 'Funcionario', descripcion: 'Funcionario administrativo' },
  { tipo_usuario: 'Contratista', descripcion: 'Personal contratista' },
];

const REGIONALES = ['Regional Distrito Capital', 'Regional Antioquia', 'Regional Valle'];

const CENTROS_POR_REGIONAL = {
  'Regional Distrito Capital': ['Centro de Servicios Financieros', 'Centro de Electricidad y Automatización Industrial'],
  'Regional Antioquia': ['Centro de Comercio'],
  'Regional Valle': ['Centro de Gestión Tecnológica de Servicios'],
};

const PROGRAMAS = [
  'Tecnólogo en Análisis y Desarrollo de Software',
  'Tecnólogo en Gestión Administrativa',
  'Tecnólogo en Gestión de Redes de Datos',
];

const seedRolesYPermisos = async () => {
  const roles = {};
  for (const r of ROLES) {
    const [rol] = await Rol.findOrCreate({ where: { nombre: r.nombre }, defaults: r });
    roles[r.nombre] = rol;
  }

  const permisos = {};
  for (const nombre of PERMISOS) {
    const [permiso] = await Permiso.findOrCreate({ where: { nombre } });
    permisos[nombre] = permiso;
  }

  // Admin: todos los permisos
  for (const permiso of Object.values(permisos)) {
    await RolPermiso.findOrCreate({ where: { rol_id: roles['Admin'].id, permiso_id: permiso.id } });
  }

  // Vigilante: subconjunto operativo
  for (const nombre of PERMISOS_VIGILANTE) {
    await RolPermiso.findOrCreate({ where: { rol_id: roles['Vigilante'].id, permiso_id: permisos[nombre].id } });
  }

  console.log(`✅ Roles y permisos sembrados (${ROLES.length} roles, ${PERMISOS.length} permisos)`);
  return roles;
};

const seedCatalogos = async () => {
  for (const t of TIPOS_USUARIO) {
    await TipoUsuario.findOrCreate({ where: { tipo_usuario: t.tipo_usuario }, defaults: t });
  }

  const regionales = {};
  for (const nombre of REGIONALES) {
    const [regional] = await RegionalFormacion.findOrCreate({ where: { nombre } });
    regionales[nombre] = regional;
  }

  for (const [regionalNombre, centros] of Object.entries(CENTROS_POR_REGIONAL)) {
    for (const nombre of centros) {
      await CentroFormacion.findOrCreate({
        where: { nombre, regional_formacion_id: regionales[regionalNombre].id },
      });
    }
  }

  for (const nombre of PROGRAMAS) {
    await ProgramaFormacion.findOrCreate({ where: { nombre } });
  }

  console.log(`✅ Catálogos sembrados (${TIPOS_USUARIO.length} tipos de usuario, ${REGIONALES.length} regionales, ${PROGRAMAS.length} programas)`);
};

const seedAdmin = async (roles) => {
  const correo = process.env.SEED_ADMIN_EMAIL || 'admin@parku.local';
  const contrasenaPlano = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

  const existente = await Usuario.findOne({ where: { correo } });
  if (existente) {
    console.log(`ℹ️  Usuario admin ya existe (${correo}), no se crea de nuevo`);
    return;
  }

  const contrasena = await PasswordUtil.hash(contrasenaPlano);
  await Usuario.create({
    nombre: 'Administrador',
    correo,
    contrasena,
    rol_id: roles['Admin'].id,
    estado: true,
  });

  console.log(`✅ Usuario admin creado: ${correo}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`   Contraseña por defecto: ${contrasenaPlano} (cámbiala o define SEED_ADMIN_PASSWORD)`);
  }
};

const seed = async () => {
  try {
    await sequelize.authenticate();
    const roles = await seedRolesYPermisos();
    await seedCatalogos();
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
