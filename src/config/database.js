// CONFIGURACION DE LA BASE DE DATOS DESDE NEON (POSTGRESQL)
import { Pool } from "pg";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;