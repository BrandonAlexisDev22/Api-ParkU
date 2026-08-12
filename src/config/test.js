import connection from "./database.js";
import dotenv from 'dotenv';
dotenv.config();
async function test() {
  try {
    console.log("Datos de conexión detectados:");
    console.log("- Host:", process.env.DB_HOST || "VACIÓ");
    console.log("- User:", process.env.DB_USER || "VACIÓ");
    const [rows] = await connection.query("SELECT 1 + 1 AS result");
    console.log("¡Conexión exitosa a Railway!", rows);
  } catch (error) {
    console.error("Error de conexión:", error.message);
  }
}

test();