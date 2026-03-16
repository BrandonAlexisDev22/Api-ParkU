const mysql = require('mysql2/promise');
require('dotenv').config();
console.log("--- DEBUG CONEXIÓN ---");
console.log("HOST:", process.env.DB_HOST);
console.log("USER:", process.env.DB_USER);
console.log("----------------------");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000 // 20 segundos de espera
});

module.exports = pool;