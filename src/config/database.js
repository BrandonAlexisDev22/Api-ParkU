const mysql = require("mysql2/promise"); // Usamos la versión con promesas

// Configuración del pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "12345678",
  database: process.env.DB_NAME || "parku",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Conexión a MySQL establecida correctamente.");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Error al conectar a MySQL:", error.message);
    return false;
  }
};

// Función para ejecutar consultas
const query = async (sql, params = []) => {
  try {
    const [rows, fields] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error("❌ Error en consulta SQL:", error.message);
    throw error;
  }
};

// Función para obtener una conexión del pool (para transacciones)
const getConnection = async () => {
  return await pool.getConnection();
};

module.exports = {
  pool,
  query,
  getConnection,
  testConnection,
};