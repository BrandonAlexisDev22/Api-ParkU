require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ── Middlewares ────────────────────────────────────────────
app.use(cors());
app.use(express.json());

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

// ── Error global ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));

module.exports = app;
