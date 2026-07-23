/**
 * @module AuditMiddleware
 * @description Registra en la tabla 'log_auditoria' todas las acciones críticas del sistema.
 * Se aplica como middleware en rutas que modifican datos (POST, PUT, PATCH, DELETE).
 */

const db = require('../config/database');

/**
 * Middleware de auditoría.
 * Guarda método, ruta, usuario y body (sin contraseña) después de que la respuesta se envía.
 */
const auditLog = (req, res, next) => {
  // Solo auditar mutaciones
  const metodosMutacion = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!metodosMutacion.includes(req.method)) return next();

  const originalJson = res.json.bind(res);

  res.json = function (data) {
    // Registrar de forma asíncrona sin bloquear la respuesta
    setImmediate(async () => {
      try {
        const usuario_id = req.usuario?.id || null;
        const accion     = `${req.method} ${req.originalUrl}`;
        const recurso    = req.originalUrl.split('/')[2] || 'unknown';

        // Limpiar datos sensibles antes de guardar
        const body = { ...req.body };
        delete body.contrasena;
        delete body.password;
        delete body.actual;
        delete body.nueva;

        await db.query(
          `INSERT INTO log_auditoria (usuario_id, accion, recurso, detalle, ip, status_code)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            usuario_id,
            accion,
            recurso,
            JSON.stringify(body),
            req.ip || req.connection.remoteAddress,
            res.statusCode
          ]
        );
      } catch (err) {
        // El log nunca debe romper la respuesta al cliente
        console.error('[Audit] Error al registrar log:', err.message);
      }
    });

    return originalJson(data);
  };

  next();
};

module.exports = { auditLog };