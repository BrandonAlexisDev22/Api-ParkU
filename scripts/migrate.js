/**
 * @module MigrationRunner
 * @description CLI de migraciones para database/migraciones/*.sql. Reemplaza al
 * script que deploy.sh ya invocaba (node scripts/migrate.js) pero que no existía
 * en el repositorio. Lleva el registro de qué migraciones se han aplicado en una
 * tabla de control (public.schema_migrations) para no volver a aplicarlas.
 *
 * Convención de archivos en database/migraciones/:
 *   NNN_nombre.sql        migración (NNN = número de 3+ dígitos)
 *   NNN_nombre_down.sql   su reversión (opcional; sin ella no se puede revertir)
 *
 * Si el archivo ya trae su propio BEGIN/COMMIT (patrón usado desde la
 * migración 006 en adelante) se ejecuta tal cual, respetando esa transacción.
 * Si no lo trae (patrón de las migraciones 002-005), este runner la envuelve
 * en una transacción para que quede todo o nada.
 *
 * Uso: node scripts/migrate.js <run|revert|show|generate> [nombre]
 * (o vía npm run migration:run / migration:revert / migration:show / migration:generate)
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRACIONES_DIR = path.join(__dirname, '..', 'database', 'migraciones');
const PATRON_ARCHIVO = /^(\d+)_.+\.sql$/;

function clienteDB() {
  const ssl = { require: true, rejectUnauthorized: false }; // requerido por Neon
  if (process.env.DATABASE_URL) {
    return new Client({ connectionString: process.env.DATABASE_URL, ssl });
  }
  return new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'parku',
    ssl,
  });
}

async function asegurarTablaControl(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      nombre      VARCHAR(255) PRIMARY KEY,
      aplicada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function listarArchivosMigracion() {
  return fs
    .readdirSync(MIGRACIONES_DIR)
    .filter((f) => PATRON_ARCHIVO.test(f) && !f.endsWith('_down.sql'))
    .sort((a, b) => parseInt(a.match(PATRON_ARCHIVO)[1], 10) - parseInt(b.match(PATRON_ARCHIVO)[1], 10));
}

function nombreArchivoDown(archivoUp) {
  return archivoUp.replace(/\.sql$/, '_down.sql');
}

async function migracionesAplicadas(client) {
  const { rows } = await client.query('SELECT nombre, aplicada_en FROM public.schema_migrations');
  return new Map(rows.map((r) => [r.nombre, r.aplicada_en]));
}

// Si el script ya trae su propio BEGIN de nivel superior, se respeta esa
// transacción tal cual (no se puede anidar una transacción de Postgres dentro
// de otra); si no, el runner la envuelve para que sea todo-o-nada.
async function ejecutarScript(client, sql) {
  const yaTieneTransaccionPropia = /^\s*BEGIN\s*;/im.test(sql);
  if (yaTieneTransaccionPropia) {
    await client.query(sql);
    return;
  }
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function cmdRun() {
  const client = clienteDB();
  await client.connect();
  try {
    await asegurarTablaControl(client);
    const aplicadas = await migracionesAplicadas(client);
    const pendientes = listarArchivosMigracion().filter(
      (archivo) => !aplicadas.has(archivo.replace(/\.sql$/, ''))
    );

    if (pendientes.length === 0) {
      console.log('No hay migraciones pendientes.');
      return;
    }

    for (const archivo of pendientes) {
      const nombre = archivo.replace(/\.sql$/, '');
      console.log(`-> Aplicando ${archivo}...`);
      const sql = fs.readFileSync(path.join(MIGRACIONES_DIR, archivo), 'utf8');
      await ejecutarScript(client, sql);
      await client.query(
        'INSERT INTO public.schema_migrations (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING',
        [nombre]
      );
      console.log(`   OK ${archivo}`);
    }
  } finally {
    await client.end();
  }
}

async function cmdRevert() {
  const client = clienteDB();
  await client.connect();
  try {
    await asegurarTablaControl(client);
    const { rows } = await client.query(
      'SELECT nombre FROM public.schema_migrations ORDER BY aplicada_en DESC, nombre DESC LIMIT 1'
    );

    if (rows.length === 0) {
      console.log('No hay migraciones aplicadas que revertir.');
      return;
    }

    const nombre = rows[0].nombre;
    const archivoUp = `${nombre}.sql`;
    const archivoDown = nombreArchivoDown(archivoUp);
    const rutaDown = path.join(MIGRACIONES_DIR, archivoDown);

    if (!fs.existsSync(rutaDown)) {
      console.error(`No existe ${archivoDown}: ${archivoUp} no se puede revertir automáticamente.`);
      process.exitCode = 1;
      return;
    }

    console.log(`-> Revirtiendo ${archivoUp} con ${archivoDown}...`);
    const sql = fs.readFileSync(rutaDown, 'utf8');
    await ejecutarScript(client, sql);
    await client.query('DELETE FROM public.schema_migrations WHERE nombre = $1', [nombre]);
    console.log(`   OK ${archivoUp} revertida.`);
  } finally {
    await client.end();
  }
}

async function cmdShow() {
  const client = clienteDB();
  await client.connect();
  try {
    await asegurarTablaControl(client);
    const aplicadas = await migracionesAplicadas(client);

    console.log('Estado de las migraciones:\n');
    for (const archivo of listarArchivosMigracion()) {
      const nombre = archivo.replace(/\.sql$/, '');
      const tieneDown = fs.existsSync(path.join(MIGRACIONES_DIR, nombreArchivoDown(archivo)));
      const marcaDown = tieneDown ? '' : '  [sin down]';
      if (aplicadas.has(nombre)) {
        console.log(`  [x] ${archivo}  (aplicada ${aplicadas.get(nombre).toISOString()})${marcaDown}`);
      } else {
        console.log(`  [ ] ${archivo}  (pendiente)${marcaDown}`);
      }
    }
  } finally {
    await client.end();
  }
}

function cmdGenerate(nombreDescriptivo) {
  if (!nombreDescriptivo) {
    console.error('Uso: npm run migration:generate -- <nombre_descriptivo>');
    process.exitCode = 1;
    return;
  }

  const slug = nombreDescriptivo
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // sin tildes
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const numerosExistentes = fs
    .readdirSync(MIGRACIONES_DIR)
    .map((f) => f.match(/^(\d+)_/))
    .filter(Boolean)
    .map((m) => parseInt(m[1], 10));
  const siguiente = String(Math.max(0, ...numerosExistentes) + 1).padStart(3, '0');

  const base = `${siguiente}_${slug}`;
  const rutaUp = path.join(MIGRACIONES_DIR, `${base}.sql`);
  const rutaDown = path.join(MIGRACIONES_DIR, `${base}_down.sql`);

  if (fs.existsSync(rutaUp)) {
    console.error(`Ya existe ${base}.sql`);
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(
    rutaUp,
    `-- =====================================================================
-- ${siguiente} -- TODO: titulo breve del cambio
-- =====================================================================
--
-- POR QUE
-- TODO: que problema resuelve.
--
-- QUE HACE (y que NO hace)
-- TODO: alcance del cambio. Preferir cambios ADITIVOS e IDEMPOTENTES
-- (IF NOT EXISTS / WHERE NOT EXISTS) para poder correr el script mas de
-- una vez sin efecto.
--
-- Reversible: TODO si/no y por que. Si es reversible, completa tambien
-- ${base}_down.sql.
-- =====================================================================

BEGIN;

-- TODO: sentencias de la migracion

COMMIT;
`,
    'utf8'
  );

  fs.writeFileSync(
    rutaDown,
    `-- Reversion de ${siguiente}.
-- TODO: sentencias que deshacen exactamente lo que hace ${base}.sql.
-- Si no es reversible, documentalo aqui (ver 008_limpieza_campos_formacion_obsoletos_down.sql
-- como ejemplo de un caso irreversible documentado, con SELECT 1; como cuerpo).

BEGIN;

-- TODO

COMMIT;
`,
    'utf8'
  );

  console.log('Creados:');
  console.log(`  ${path.relative(process.cwd(), rutaUp)}`);
  console.log(`  ${path.relative(process.cwd(), rutaDown)}`);
}

async function main() {
  const [, , comando, ...resto] = process.argv;

  switch (comando) {
    case 'run':
      await cmdRun();
      break;
    case 'revert':
      await cmdRevert();
      break;
    case 'show':
      await cmdShow();
      break;
    case 'generate':
      cmdGenerate(resto.join(' '));
      break;
    default:
      console.log('Uso: node scripts/migrate.js <run|revert|show|generate> [nombre]');
      process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exitCode = 1;
});
