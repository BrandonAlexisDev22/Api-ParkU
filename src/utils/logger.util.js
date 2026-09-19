const fs = require('fs');
const path = require('path');

// Crear carpeta de logs si no existe
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Un WriteStream por día, reutilizado entre llamadas: escribir con appendFileSync (como
// antes) abre y cierra el archivo en CADA log y, al ser síncrono, bloquea el event loop --
// con un log por request eso serializa peticiones concurrentes detrás de disco. El stream
// hace la escritura en background (libuv) y el propio stream bufferiza, así que no hay
// abrir/cerrar por línea.
let streamActual = null;
let fechaDelStream = null;

const obtenerStream = () => {
  const fecha = new Date().toISOString().split('T')[0];
  if (streamActual && fechaDelStream === fecha) return streamActual;

  if (streamActual) streamActual.end();
  fechaDelStream = fecha;
  streamActual = fs.createWriteStream(path.join(logDir, `${fecha}.log`), { flags: 'a' });
  streamActual.on('error', (error) => {
    console.error('Error escribiendo el log en disco:', error.message);
  });
  return streamActual;
};

class Logger {
  /**
   * Escribe un mensaje en el archivo de log
   */
  static writeLog(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };

    // Mostrar en consola
    const color = level === 'ERROR' ? '\x1b[31m' :
                  level === 'WARN' ? '\x1b[33m' :
                  level === 'AUDIT' ? '\x1b[36m' : '\x1b[32m';
    console.log(`${color}[${level}]${'\x1b[0m'} ${timestamp} - ${message}`);

    // Guardar en archivo (no bloqueante, ver obtenerStream)
    obtenerStream().write(JSON.stringify(logEntry) + '\n');
  }

  /**
   * Log de información general
   */
  static info(message, data = null) {
    this.writeLog('INFO', message, data);
  }

  /**
   * Log de advertencia
   */
  static warn(message, data = null) {
    this.writeLog('WARN', message, data);
  }

  /**
   * Log de error
   */
  static error(message, data = null) {
    this.writeLog('ERROR', message, data);
  }

  /**
   * Log de auditoría (acciones de usuarios)
   */
  static audit(usuarioId, accion, detalles = null) {
    this.writeLog('AUDIT', `Usuario ${usuarioId}: ${accion}`, detalles);
  }

  /**
   * Log de peticiones HTTP (para usar con Morgan)
   */
  static http(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
      if (res.statusCode >= 400) {
        this.warn(message, { ip: req.ip, userAgent: req.get('user-agent') });
      } else {
        this.info(message, { ip: req.ip, userAgent: req.get('user-agent') });
      }
    });
    next();
  }
}

module.exports = Logger;