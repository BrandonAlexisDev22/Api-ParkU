require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { swaggerDocs } = require('./config/swagger');
const { testConnection, pool, query } = require('./config/database');
const Logger = require('./utils/logger.util');
const { auditLog, auditLoginAttempt, auditTokenExpired } = require('./middlewares/audit.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// 1. CONFIGURACIÓN DE SEGURIDAD Y MIDDLEWARES
// =============================================

// Helmet para headers de seguridad
app.use(helmet());

// CORS configurado
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limit Global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 peticiones por IP
  message: {
    status: 429,
    message: 'Demasiadas solicitudes desde esta IP, intente más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Morgan para logging (con Logger personalizado)
app.use((req, res, next) => {
  Logger.http(req, res, next);
});

// =============================================
// 2. MIDDLEWARES DE AUDITORÍA
// =============================================

// Auditoría de login fallidos
app.use('/api/auth/login', auditLoginAttempt);

// Auditoría de tokens expirados
app.use(auditTokenExpired);

// Auditoría de mutaciones (POST, PUT, PATCH, DELETE)
app.use(auditLog);

// =============================================
// 3. RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// =============================================

// Health check
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    timestamp: new Date(),
    version: '1.0.0',
    database: dbConnected ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// Test de conexión a base de datos
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await query('SELECT NOW() AS fecha_hora, current_database() AS base_datos');
    res.status(200).json({
      success: true,
      message: '✅ Conexión exitosa con PostgreSQL',
      data: {
        fecha_hora: result[0]?.fecha_hora,
        base_datos: result[0]?.base_datos,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT
      }
    });
  } catch (error) {
    Logger.error('Error conectando a PostgreSQL', {
      error: error.message,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME
    });
    res.status(500).json({
      success: false,
      message: '❌ Error de conexión con la base de datos',
      error: error.message
    });
  }
});

// Información general de la API
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "ParkU API",
    version: "1.0.0",
    status: "OK"
  });
});

// =============================================
// 4. RUTAS DE AUTENTICACIÓN (PÚBLICAS)
// =============================================
app.use('/api/auth', require('./routes/auth.routes'));

// =============================================
// 5. RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
// =============================================

// Gestión de Usuarios
app.use('/api/usuarios', require('./routes/usuario.routes'));

// Gestión de Roles (Solo Admin)
app.use('/api/roles', require('./routes/rol.routes'));

// Gestión de Permisos (Solo Admin)
app.use('/api/permisos', require('./routes/permiso.routes'));

// Asignación de Permisos (Solo Admin)
app.use('/api/roles-permisos', require('./routes/rolPermiso.routes'));

// Gestión de Perfiles
app.use('/api/perfiles', require('./routes/perfil.routes'));

// Gestión de Conductores
app.use('/api/conductores', require('./routes/conductor.routes'));

// Gestión de Vehículos
app.use('/api/vehiculos', require('./routes/vehiculo.routes'));

// Gestión de Parqueaderos
app.use('/api/parqueaderos', require('./routes/parqueadero.routes'));

// Gestión de Celdas
app.use('/api/celdas', require('./routes/celda.routes'));

// Control de Entradas y Salidas
app.use('/api/entradas-salidas', require('./routes/entradaSalida.routes'));

// Gestión de Reservas
app.use('/api/reservas', require('./routes/reserva.routes'));

// Gestión de Novedades/Reportes
app.use('/api/novedades', require('./routes/novedades.routes'));

// =============================================
// 6. MANEJADOR DE RUTAS NO ENCONTRADAS (404)
// =============================================
app.use((req, res) => {
  Logger.warn('Ruta no encontrada', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// =============================================
// 7. MANEJADOR DE ERRORES GLOBAL
// =============================================
app.use((err, req, res, next) => {
  // Log del error
  Logger.error('Error no controlado', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    usuario: req.usuario?.id || 'anónimo'
  });
  
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// =============================================
// 8. INICIAR SERVIDOR
// =============================================
app.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    🅿️  ParkU API v1.0.0                      ║
╠═══════════════════════════════════════════════════════════════╣
║  🚀 Servidor ejecutándose en puerto ${PORT}
║  📖 Documentación: http://localhost:${PORT}/api-docs
║  💾 Base de datos: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}
║  🔐 Autenticación: JWT
║  📡 Health check: http://localhost:${PORT}/api/health
║  🧪 Test DB: http://localhost:${PORT}/api/test-db
╚═══════════════════════════════════════════════════════════════╝
  `);
  
  // Inicializar Swagger
  swaggerDocs(app, PORT);
  
  // Probar conexión a BD
  await testConnection();
  
  Logger.info('Servidor iniciado correctamente', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// =============================================
// 9. CIERRE GRACEFUL (Graceful Shutdown)
// =============================================
process.on('SIGTERM', () => {
  Logger.info('Recibida señal SIGTERM, cerrando servidor...');
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  Logger.info('Recibida señal SIGINT, cerrando servidor...');
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

module.exports = app;