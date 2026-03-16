import mysql from "mysql2/promise";

/**
 * Conexión a la base de datos MySQL en Railway
 */
const connection = mysql.createPool({
  host: "yamanote.proxy.rlwy.net",
  user: "root",
  password: "sWNIubZJgnAUuljneIDxWBdwemgfdTSe",
  database: "railway",
  port: 28484,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default connection;