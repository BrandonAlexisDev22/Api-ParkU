require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { swaggerDocs } = require('./config/swagger');
const { testConnection } = require('./config/database');

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

// Morgan para logging
app.use(morgan('combined'));

// =============================================
// 2. RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
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

// Información general de la API
app.get('/', (req, res) => {
  res.json({
    nombre: 'ParkU API',
    version: '1.0.0',
    descripcion: 'API REST para la gestión integral de parqueaderos',
    estado: 'operativa',
    tecnologia: {
      backend: 'Node.js',
      framework: 'Express.js',
      autenticacion: 'JWT',
      documentacion: 'Swagger',
      baseDeDatos: process.env.DB_NAME
    },
    endpoints: {
      salud: '/api/health',
      login: '/api/auth/login',
      registro: '/api/auth/registro',
      verificar: '/api/auth/verificar',
      refresh: '/api/auth/refresh-token',
      logout: '/api/auth/logout',
      documentacion: '/api-docs'
    },
    fecha: new Date().toISOString()
  });
});

// =============================================
// 3. RUTAS DE AUTENTICACIÓN (PÚBLICAS)
// =============================================
app.use('/api/auth', require('./routes/auth.routes'));

// =============================================
// 4. RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
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
// 5. MANEJADOR DE RUTAS NO ENCONTRADAS (404)
// =============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// =============================================
// 6. MANEJADOR DE ERRORES GLOBAL
// =============================================
app.use((err, req, res, next) => {
  console.error('❌ Error no controlado:', err.message);
  console.error(err.stack);
  
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// =============================================
// 7. INICIAR SERVIDOR
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
╚═══════════════════════════════════════════════════════════════╝
  `);
  
  // Inicializar Swagger
  swaggerDocs(app, PORT);
  
  // Probar conexión a BD
  await testConnection();
});

// =============================================
// 8. CIERRE GRACEFUL (Graceful Shutdown)
// =============================================
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

module.exports = app;