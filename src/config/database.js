// CONFIGURACION DE LA BASE DE DATOS DESDE NEON (POSTGRESQL)
import { Pool } from "pg";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});


//CONSULTA DE PRUEBA
const result = await pool.query("SELECT * FROM users");
console.log(result.rows);

export default pool;