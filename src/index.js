require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { swaggerDocs } = require("./config/swagger");
const { testConnection, sequelize } = require("./config/database");
const Logger = require("./utils/logger.util");
const { limitadorGlobal } = require("./middlewares/rateLimit.middleware");
const {
  verificarConexion: verificarConexionCorreo,
} = require("./utils/mailer.util");

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// 1. CONFIGURACIÓN DE SEGURIDAD Y MIDDLEWARES
// =============================================

// Detrás de Railway/nginx: que req.protocol/req.ip reflejen X-Forwarded-* (necesario para
// construir URLs públicas https de los archivos subidos, ver upload.middleware.js).
app.set('trust proxy', 1);

// Helmet para headers de seguridad
app.use(helmet());

// CORS configurado
// Los orígenes de CORS_ORIGIN se recortan (evita fallos por espacios extra tipo
// "a, b") y siempre se permite el frontend de producción, aunque falte o esté
// mal escrito en la variable de entorno del servicio desplegado.
const DEFAULT_CORS_ORIGINS = ["https://park-u.vercel.app"];
const envCorsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigins = [...new Set([...envCorsOrigins, ...DEFAULT_CORS_ORIGINS])];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Techo global de peticiones por IP (ver src/middlewares/rateLimit.middleware.js). Los
// endpoints de autenticación llevan además límites propios, más estrictos.
app.use(limitadorGlobal);

// Parsear JSON. El límite es para cuerpos JSON/formularios: los archivos van por multer con
// su propio tope (5 MB). Un JSON de 10 MB no tiene ningún uso legítimo aquí y solo servía
// para obligar al servidor a parsear cuerpos enormes.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

// Archivos subidos (foto de perfil, evidencia de novedades) -- disco local, ver
// src/middlewares/upload.middleware.js. El despliegue (deploy.sh) es git pull + pm2
// restart sobre un VPS con disco persistente, no contenedores efímeros.
// helmet() pone Cross-Origin-Resource-Policy: same-origin en todas las respuestas, lo que
// hace que el navegador bloquee <img src="https://api.../uploads/..."> desde el frontend
// (otro origen). Para los archivos subidos se relaja a cross-origin.
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  // Sin listados de directorio ni archivos ocultos: aquí solo viven imágenes/evidencias con
  // nombre UUID, y nada más debería poder leerse por esta ruta.
  index: false,
  dotfiles: 'deny',
}));

// Logging de requests HTTP (Logger personalizado)
app.use((req, res, next) => {
  Logger.http(req, res, next);
});

// =============================================
// 2. AUDITORÍA
// =============================================
// La auditoría de mutaciones (CREAR/EDITAR/CAMBIAR_ESTADO/ELIMINAR) la hace la propia
// base de datos vía trigger (fn_auditoria_generica -> tabla 'auditoria'), no un
// middleware de Express -- ver database/parku.postgres y src/utils/dbContext.util.js.
// Se expone en modo lectura en GET /api/auditoria.

// =============================================
// 3. RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// =============================================

// Health check
app.get("/api/health", async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: "ok",
    timestamp: new Date(),
    version: "1.0.0",
    database: dbConnected ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

// Test de conexión a base de datos. Es público, así que NO devuelve host, puerto, nombre
// de la base ni el mensaje de error del driver: eso es información de infraestructura que
// solo debe verse en el log del servidor.
app.get("/api/test-db", async (req, res) => {
  try {
    const [result] = await sequelize.query("SELECT NOW() AS fecha_hora");
    res.status(200).json({
      success: true,
      message: "✅ Conexión exitosa con PostgreSQL",
      data: { fecha_hora: result[0]?.fecha_hora },
    });
  } catch (error) {
    Logger.error("Error conectando a PostgreSQL", {
      error: error.message,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
    });
    res.status(500).json({
      success: false,
      message: "❌ Error de conexión con la base de datos",
    });
  }
});

// Información general de la API
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ParkU API",
    version: "1.0.0",
    status: "OK",
  });
});

// =============================================
// 4. RUTAS DE AUTENTICACIÓN (PÚBLICAS)
// =============================================
app.use("/api/auth", require("./routes/auth.routes"));

// =============================================
// 5. RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
// =============================================

// Gestión de Usuarios
app.use("/api/usuarios", require("./routes/usuario.routes"));

// Gestión de Roles (Solo Admin)
app.use("/api/roles", require("./routes/rol.routes"));

// Gestión de Permisos (Solo Admin)
// Catálogo de módulos: agrupa los permisos y lo consume la pantalla de crear/editar rol.
app.use("/api/modulos", require("./routes/modulo.routes"));

app.use("/api/permisos", require("./routes/permiso.routes"));

// Asignación de Permisos (Solo Admin)
app.use("/api/roles-permisos", require("./routes/rolPermiso.routes"));

// Gestión de Conductores
app.use("/api/conductores", require("./routes/conductor.routes"));

// Catálogos de referencia (tipo usuario, regional/centro/programa de formación)
app.use("/api/catalogos", require("./routes/catalogos.routes"));

// Gestión de Vehículos
app.use("/api/vehiculos", require("./routes/vehiculo.routes"));

// Gestión de Parqueaderos
app.use("/api/parqueaderos", require("./routes/parqueadero.routes"));

// Gestión de Celdas
app.use("/api/celdas", require("./routes/celda.routes"));

// Control de Entradas y Salidas
app.use("/api/entradas-salidas", require("./routes/entradaSalida.routes"));

// Gestión de Reservas
app.use("/api/reservas", require("./routes/reserva.routes"));

// Gestión de Novedades/Reportes
app.use("/api/novedades", require("./routes/novedades.routes"));

// Evidencias de novedades (borrado directo por ID; alta/listado van bajo /api/novedades/:id/evidencias)
app.use("/api/evidencias", require("./routes/evidenciaNovedad.routes"));

// Equipamiento de parqueaderos (edición/borrado directo por ID)
app.use(
  "/api/equipamiento",
  require("./routes/equipamientoParqueadero.routes"),
);

// Ocupación de celdas (quién ocupa cada celda ahora e histórico; solo lectura)
app.use("/api/ocupaciones", require("./routes/ocupacionCelda.routes"));

// Monitoreo en vivo del parqueadero (celdas + ocupación + vehículos fuera de horario)
app.use("/api/monitoreo", require("./routes/monitoreo.routes"));

// Notificaciones del usuario autenticado
app.use("/api/notificaciones", require("./routes/notificacion.routes"));

// Notificaciones por correo con Resend (solo administradores)
app.use(
  "/api/notificaciones/email",
  require("./routes/notificacionEmail.routes"),
);

// Auditoría (solo lectura, solo administradores)
app.use("/api/auditoria", require("./routes/auditoria.routes"));

// Asignación de turnos de vigilantes
app.use(
  "/api/asignaciones-vigilante",
  require("./routes/asignacionVigilante.routes"),
);

// =============================================
// 6. MANEJADOR DE RUTAS NO ENCONTRADAS (404)
// =============================================
app.use((req, res) => {
  Logger.warn("Ruta no encontrada", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
    status: 404,
  });
});

// =============================================
// 7. MANEJADOR DE ERRORES GLOBAL
// =============================================
app.use((err, req, res, next) => {
  // Errores del parseo del cuerpo (JSON malformado, cuerpo demasiado grande, charset no
  // soportado): son culpa del cliente, no del servidor. Se responden con su código real
  // (400/413/415) y sin llegar al log de errores, que es para fallos nuestros.
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "El cuerpo de la petición no es JSON válido" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "El cuerpo de la petición es demasiado grande" });
  }
  if (err.type === "charset.unsupported" || err.type === "encoding.unsupported") {
    return res.status(415).json({ success: false, message: "Codificación no soportada" });
  }

  // Log del error
  Logger.error("Error no controlado", {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    usuario: req.usuario?.id || "anónimo",
  });

  // Nunca se devuelve err.message ni el stack: pueden contener SQL, rutas del servidor o
  // detalles del driver.
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
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

  // Probar SMTP: un fallo aquí no impide arrancar (los correos son un efecto secundario
  // del registro, no un requisito), pero deja claro en el log que las verificaciones de
  // correo no van a salir, en vez de descubrirlo cuando un usuario no reciba el enlace.
  verificarConexionCorreo()
    .then(({ configurado, ok, detalle }) => {
      if (!configurado) console.log(`📧 Correo: sin configurar — ${detalle}`);
      else if (ok) console.log("📧 Correo: SMTP verificado correctamente");
      else
        console.log(
          `📧 Correo: SMTP configurado pero falló la conexión — ${detalle}`,
        );
    })
    .catch(() => {});

  Logger.info("Servidor iniciado correctamente", {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
  });
});

// =============================================
// 9. CIERRE GRACEFUL (Graceful Shutdown)
// =============================================
process.on("SIGTERM", () => {
  Logger.info("Recibida señal SIGTERM, cerrando servidor...");
  console.log("🛑 Recibida señal SIGTERM, cerrando servidor...");
  process.exit(0);
});

process.on("SIGINT", () => {
  Logger.info("Recibida señal SIGINT, cerrando servidor...");
  console.log("🛑 Recibida señal SIGINT, cerrando servidor...");
  process.exit(0);
});

module.exports = app;
