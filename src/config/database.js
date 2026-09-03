require('dotenv').config();

const { Sequelize } = require('sequelize');
const { types } = require('pg');

// Todas las columnas de fecha del esquema son 'timestamp without time zone' (sin
// zona horaria) y toda la app las trata como instantes UTC (nunca se configura una
// zona horaria de sesión). Sin este parser, node-postgres reinterpreta el string
// devuelto por Postgres como hora LOCAL del proceso Node (no UTC) -- en una máquina
// con zona horaria distinta de UTC (p. ej. America/Bogota, UTC-5) esto desfasa cada
// fecha leída varias horas frente a la que se escribió, lo cual es especialmente grave
// para comparaciones de expiración de tokens (recuperacion_password, verificacion_correo):
// un token pensado para durar 60 minutos podía seguir siendo válido varias horas más.
// OID 1114 = timestamp sin zona horaria.
types.setTypeParser(1114, (valor) => (valor === null ? null : new Date(`${valor.replace(' ', 'T')}Z`)));

// =============================================
// CONFIGURACIÓN DE NEON POSTGRESQL (Sequelize)
// =============================================

let sequelize;

const commonOptions = {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // requerido por Neon
    },
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    min: 0,
    acquire: 30000,
    idle: 30000,
  },
};

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, commonOptions);
  console.log('🔌 Conectando a Neon usando DATABASE_URL (Sequelize)');
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'parku',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      ...commonOptions,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
    }
  );
  console.log('🔌 Conectando a Neon usando variables separadas (Sequelize)');
}

// =============================================
// PROBAR CONEXIÓN
// =============================================

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Base de datos Neon conectada correctamente (Sequelize)');
    return true;
  } catch (error) {
    console.error('❌ No se pudo conectar a Neon PostgreSQL');
    console.error('Error:', error.message);
    return false;
  }
};

// =============================================
// CERRAR CONEXIÓN
// =============================================

const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('✅ Conexión de Sequelize cerrada correctamente');
  } catch (error) {
    console.error('❌ Error al cerrar la conexión:', error.message);
  }
};

module.exports = {
  sequelize,
  testConnection,
  closeConnection,
};