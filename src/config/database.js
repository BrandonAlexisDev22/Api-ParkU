require('dotenv').config();

const { Pool } = require('pg');

// =============================================
// CONFIGURACIÓN DE NEON POSTGRESQL
// =============================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

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
    console.error('❌ Error ejecutando consulta SQL:', error);
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
    console.error('❌ Error ejecutando consulta SQL:', error);
    throw error;
  }
};

// =============================================
// PROBAR CONEXIÓN
// =============================================

const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW() AS fecha');

    console.log('✅ Base de datos Neon conectada correctamente');
    console.log('🕐 Hora del servidor PostgreSQL:', result.rows[0].fecha);

    return true;
  } catch (error) {
    console.error('❌ No se pudo conectar a Neon PostgreSQL');
    console.error('Error:', error.message);

    return false;
  }
};

// =============================================
// EXPORTACIONES
// =============================================

module.exports = {
  pool,
  query,
  queryOne,
  testConnection,
};