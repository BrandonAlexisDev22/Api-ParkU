import connection from "./database.js";

async function test() {
  try {
    const [rows] = await connection.query("SELECT 1");
    console.log("Conexion exitosa a Railway");
  } catch (error) {
    console.error("Error de conexion:", error);
  }
}

test();