/**
 * @file index.js
 * @description
 * Punto de entrada principal de la API del sistema ParkU.
 *
 * Este archivo se encarga de:
 * - Inicializar el servidor Express
 * - Configurar middlewares globales
 * - Registrar las rutas de los módulos del sistema
 * - Iniciar el servidor en el puerto configurado
 *
 * Arquitectura utilizada:
 * Cliente → Routes → Controllers → Services → Repositories → Datos
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

/**
 * ─────────────────────────────────────────
 * Middlewares globales
 * ─────────────────────────────────────────
 */

/**
 * Middleware CORS
 * Permite que la API sea consumida desde otros dominios
 * (por ejemplo un frontend en React o Angular).
 */
app.use(cors());

/**
 * Middleware para parsear el body de las solicitudes en formato JSON.
 */
app.use(express.json());


/**
 * ─────────────────────────────────────────
 * Definición de rutas de la API
 * ─────────────────────────────────────────
 */

/**
 * Rutas del módulo de roles
 * Prefijo: /api/roles
 */
app.use('/api/roles', require('./routes/roles.routes'));

/**
 * Rutas del módulo de permisos
 * Prefijo: /api/permisos
 */
app.use('/api/permisos', require('./routes/permisos.routes'));

/**
 * Rutas del módulo de usuarios
 * Prefijo: /api/usuarios
 */
app.use('/api/usuarios', require('./routes/usuarios.routes'));


/**
 * Rutas del módulo de usuarios
 * Prefijo: /api/usuarios
 */
app.use('/api/parqueaderos', require('./routes/parqueaderos.routes'));


/**
 * ─────────────────────────────────────────
 * Configuración del puerto del servidor
 * ─────────────────────────────────────────
 */

const PORT = process.env.PORT || 3000;


/**
 * Inicia el servidor Express
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});