const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345678",
  database: "parku",
});

connection.connect((error) => {
  if (error) {
    console.log("Error de conexión:", error);
    return;
  }

  console.log("MySQL conectado");
});

module.exports = connection;