require('dotenv').config();

const { Pool } = require('pg');

// =============================================
// CONFIGURACIÓN DE NEON POSTGRESQL
// =============================================

// Si existe DATABASE_URL, usarla (prioridad)
// Si no, usar variables separadas
let poolConfig;

if (process.env.DATABASE_URL) {
  // Usar URL completa
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
  console.log('🔌 Conectando a Neon usando DATABASE_URL');
} else {
  // Usar variables separadas
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'parku',
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: process.env.DB_SSL === 'true' || process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : false,
  };
  console.log('🔌 Conectando a Neon usando variables separadas');
}

const pool = new Pool(poolConfig);

// =============================================
// EVENTOS DE CONEXIÓN
// =============================================

pool.on('connect', () => {
  console.log('✅ Conexión establecida con Neon PostgreSQL');
});

pool.on('error', (error) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', error);
});

// =============================================
// CONSULTA GENERAL
// =============================================

const query = async (text, params = []) => {
  try {
    const result = await pool.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('❌ Error ejecutando consulta SQL:', error.message);
    console.error('📝 SQL:', text);
    console.error('📦 Parámetros:', params);
    throw error;
  }
};

// =============================================
// CONSULTA DE UN SOLO REGISTRO
// =============================================

const queryOne = async (text, params = []) => {
  try {
    const result = await pool.query(text, params);
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Error ejecutando consulta SQL:', error.message);
    console.error('📝 SQL:', text);
    console.error('📦 Parámetros:', params);
    throw error;
  }
};

// =============================================
// TRANSACCIONES
// =============================================

const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// =============================================
// PROBAR CONEXIÓN
// =============================================

const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW() AS fecha, current_database() AS base_datos');
    console.log('✅ Base de datos Neon conectada correctamente');
    console.log('🕐 Hora del servidor PostgreSQL:', result.rows[0].fecha);
    console.log('🗄️  Base de datos:', result.rows[0].base_datos);
    return true;
  } catch (error) {
    console.error('❌ No se pudo conectar a Neon PostgreSQL');
    console.error('Error:', error.message);
    return false;
  }
};

// =============================================
// CERRAR POOL
// =============================================

const closePool = async () => {
  try {
    await pool.end();
    console.log('✅ Pool de conexiones cerrado correctamente');
  } catch (error) {
    console.error('❌ Error al cerrar el pool:', error.message);
  }
};

// =============================================
// EXPORTACIONES
// =============================================

module.exports = {
  pool,
  query,
  queryOne,
  transaction,
  testConnection,
  closePool,
};