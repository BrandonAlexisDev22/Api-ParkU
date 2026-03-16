require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const { swaggerDocs } = require('../src/config/swagger');

const app = express();

// ── Middlewares ────────────────────────────────────────────
app.use(helmet());                 // Seguridad básica (cabeceras)
app.use(express.json({ limit: '10mb' }));  // Limite tamaño request
app.use(express.urlencoded({ extended: false }));
app.use(morgan('combined'));       // Logging de requests

// ── CORS ───────────────────────────────────────────────────
// Solo permitir orígenes seguros en producción
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000'];
app.use(cors({
  origin: function(origin, callback) {
    // Permite requests sin origen (ej. Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS no permitido por política'));
    }
    return callback(null, true);
  }
}));

// ── Rutas ──────────────────────────────────────────────────
app.use('/api/roles',            require('./routes/rol.routes'));
app.use('/api/permisos',         require('./routes/permiso.routes'));
app.use('/api/roles-permisos',   require('./routes/rolPermiso.routes'));
app.use('/api/usuarios',         require('./routes/usuario.routes'));
app.use('/api/perfiles',         require('./routes/perfil.routes'));
app.use('/api/conductores',      require('./routes/conductor.routes'));
app.use('/api/vehiculos',        require('./routes/vehiculo.routes'));
app.use('/api/parqueaderos',     require('./routes/parqueadero.routes'));
app.use('/api/celdas',           require('./routes/celda.routes'));
app.use('/api/entradas-salidas', require('./routes/entradaSalida.routes'));
app.use('/api/reservas',         require('./routes/reserva.routes'));
app.use('/api/reportes',         require('./routes/reporte.routes'));

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── 404 ────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

// ── Error handler global ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor', error: err.message });
});

// ── Swagger docs ───────────────────────────────────────────
swaggerDocs(app, process.env.PORT || 3000);

// ── Export / Listen ────────────────────────────────────────
if (process.env.VERCEL) {
  // Para Vercel (Serverless)
  const serverless = require('serverless-http');
  module.exports = serverless(app);
} else {
  // Para Render o despliegue tradicional
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  });
}

module.exports = app;