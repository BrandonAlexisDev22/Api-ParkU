require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { swaggerDocs } = require('./src/config/swagger');
const { verificarToken, verificarRol } = require('./src/middleware/auth.middleware');

const app = express();

// ────────────────────────────────────────────────────────────────────────────
// ── CONFIGURACIÓN DE SEGURIDAD Y MIDDLEWARES ────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────

// Helmet para headers de seguridad
app.use(helmet());

// CORS configurado
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));

// Parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Morgan para logging
app.use(morgan('combined'));

// ────────────────────────────────────────────────────────────────────────────
// ── RUTAS PÚBLICAS (SIN AUTENTICACIÓN) ──────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/salud:
 *   get:
 *     summary: Verificar estado del servidor
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: Servidor funcionando correctamente
 */
app.get('/api/salud', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    version: '1.0.0'
  });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - contrasena
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *               contrasena:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 usuario:
 *                   type: object
 *       401:
 *         description: Credenciales inválidas
 */
app.post('/api/auth/login', require('./src/controllers/usuario.controller').login);

/**
 * @swagger
 * /api/auth/registro:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - contrasena
 *               - nombre
 *             properties:
 *               correo:
 *                 type: string
 *               contrasena:
 *                 type: string
 *               nombre:
 *                 type: string
 *               numero:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       409:
 *         description: El correo ya está registrado
 */
app.post('/api/auth/registro', require('./src/controllers/usuario.controller').create);

// ────────────────────────────────────────────────────────────────────────────
// ── MIDDLEWARE DE AUTENTICACIÓN (Aplica a todas las rutas siguientes) ───────
// ────────────────────────────────────────────────────────────────────────────

app.use(verificarToken);

// ────────────────────────────────────────────────────────────────────────────
// ── RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN) ──────────────────────────────
// ────────────────────────────────────────────────────────────────────────────

// ── GESTIÓN DE USUARIOS ──────────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gestión de cuentas y perfiles de usuario
 */
app.use('/api/usuarios', require('./src/routes/usuario.routes'));

// ── GESTIÓN DE ROLES Y PERMISOS ──────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Administración de roles del sistema
 */
app.use('/api/roles', verificarRol(['admin']), require('./src/routes/rol.routes'));

/**
 * @swagger
 * tags:
 *   name: Permisos
 *   description: Administración de permisos
 */
app.use('/api/permisos', verificarRol(['admin']), require('./src/routes/permiso.routes'));

app.use('/api/roles-permisos', verificarRol(['admin']), require('./src/routes/rolPermiso.routes'));

// ── GESTIÓN DE PERFILES ──────────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Perfiles
 *   description: Categorías de usuario
 */
app.use('/api/perfiles', require('./src/routes/perfil.routes'));

// ── GESTIÓN DE CONDUCTORES ───────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Conductores
 *   description: Gestión de perfiles de conductores
 */
app.use('/api/conductores', require('./src/routes/conductor.routes'));

// ── GESTIÓN DE VEHÍCULOS ─────────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Vehículos
 *   description: Administración de flota de vehículos
 */
app.use('/api/vehiculos', require('./src/routes/vehiculo.routes'));

// ── GESTIÓN DE PARQUEADEROS ──────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Parqueaderos
 *   description: Administración de sedes y ubicaciones
 */
app.use('/api/parqueaderos', require('./src/routes/parqueadero.routes'));

// ── GESTIÓN DE CELDAS ────────────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Celdas
 *   description: Gestión de espacios de parqueo
 */
app.use('/api/celdas', require('./src/routes/celda.routes'));

// ── CONTROL DE ENTRADAS Y SALIDAS ────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Control de Acceso
 *   description: Registro de movimientos de vehículos
 */
app.use('/api/entradas-salidas', require('./src/routes/entradaSalida.routes'));

// ── GESTIÓN DE RESERVAS ──────────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Reservas
 *   description: Administración de reservas de celdas
 */
app.use('/api/reservas', require('./src/routes/reserva.routes'));

// ── GESTIÓN DE REPORTES ──────────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   name: Reportes
 *   description: Registro de incidencias y novedades
 */
app.use('/api/reportes', require('./src/routes/reporte.routes'));

// ────────────────────────────────────────────────────────────────────────────
// ── DOCUMENTACIÓN SWAGGER ───────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    🅿️  ParkU API v1.0.0                      ║
╠═══════════════════════════════════════════════════════════════╣
║  🚀 Servidor ejecutándose en puerto ${PORT}
║  📖 Documentación: http://localhost:${PORT}/api-docs
║  💾 Base de datos: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}
║  🔐 Autenticación: JWT
╚═══════════════════════════════════════════════════════════════╝
  `);
  swaggerDocs(app, PORT);
});

module.exports = app;