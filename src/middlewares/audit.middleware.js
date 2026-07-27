/**
 * ====================================================
 * MIDDLEWARE DE AUDITORÍA
 * ====================================================
 * 
 * Registra en la tabla 'log_auditoria' todas las acciones
 * críticas del sistema (POST, PUT, PATCH, DELETE).
 * 
 * @module AuditMiddleware
 */

const { query } = require('../config/database');

/**
 * Middleware de auditoría
 * Guarda método, ruta, usuario y body (sin datos sensibles)
 * después de que la respuesta se envía al cliente.
 * 
 * @param {Object} req - Petición HTTP
 * @param {Object} res - Respuesta HTTP
 * @param {Function} next - Función para continuar
 */
const auditLog = (req, res, next) => {
  // Solo auditar mutaciones (POST, PUT, PATCH, DELETE)
  const metodosMutacion = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!metodosMutacion.includes(req.method)) return next();

  // Guardar referencia al método original
  const originalJson = res.json.bind(res);

  // Sobrescribir res.json para interceptar la respuesta
  res.json = function (data) {
    // Registrar de forma asíncrona sin bloquear la respuesta
    setImmediate(async () => {
      try {
        // Datos básicos
        const usuario_id = req.usuario?.id || null;
        const accion = `${req.method} ${req.originalUrl}`;
        const recurso = req.originalUrl.split('/')[2] || 'unknown';
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
        const status_code = res.statusCode;

        // Limpiar datos sensibles antes de guardar
        const body = { ...req.body };
        delete body.contrasena;
        delete body.password;
        delete body.actual;
        delete body.nueva;
        delete body.token;
        delete body.refreshToken;

        // Detalle con información útil
        const detalle = {
          body,
          params: req.params,
          query: req.query,
          method: req.method,
          url: req.originalUrl,
          status: status_code,
          usuario: req.usuario?.correo || null
        };

        // ✅ PostgreSQL: usar $1, $2... en lugar de ?
        await query(
          `INSERT INTO log_auditoria 
           (usuario_id, accion, recurso, detalle, ip, status_code, fecha_hora) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            usuario_id,
            accion,
            recurso,
            JSON.stringify(detalle),
            ip,
            status_code
          ]
        );
      } catch (err) {
        // El log nunca debe romper la respuesta al cliente
        console.error('[Audit] Error al registrar log:', err.message);
      }
    });

    // Llamar al método original con los datos
    return originalJson(data);
  };

  next();
};

/**
 * Middleware para auditar intentos de login fallidos
 */
const auditLoginAttempt = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    setImmediate(async () => {
      try {
        if (res.statusCode === 401 || res.statusCode === 403) {
          await query(
            `INSERT INTO log_auditoria 
             (usuario_id, accion, recurso, detalle, ip, status_code, fecha_hora) 
             VALUES (NULL, $1, $2, $3, $4, $5, NOW())`,
            [
              'INTENTO_LOGIN_FALLIDO',
              'auth/login',
              JSON.stringify({
                correo: req.body.correo || 'unknown',
                error: data?.message || 'Credenciales inválidas',
                userAgent: req.get('user-agent')
              }),
              req.ip || req.headers['x-forwarded-for'] || 'unknown',
              res.statusCode
            ]
          );
        }
      } catch (err) {
        console.error('[Audit] Error al registrar intento fallido:', err.message);
      }
    });

    return originalJson(data);
  };

  next();
};

/**
 * Middleware para auditar tokens expirados
 */
const auditTokenExpired = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    setImmediate(async () => {
      try {
        const token = req.headers.authorization?.split(' ')[1] || 'no-token';
        
        if (res.statusCode === 401 && data?.message?.includes('expirado')) {
          await query(
            `INSERT INTO log_auditoria 
             (usuario_id, accion, recurso, detalle, ip, status_code, fecha_hora) 
             VALUES (NULL, $1, $2, $3, $4, $5, NOW())`,
            [
              'TOKEN_EXPIRADO',
              req.originalUrl || 'unknown',
              JSON.stringify({
                token_preview: token.substring(0, 20) + '...',
                userAgent: req.get('user-agent'),
                error: data.message
              }),
              req.ip || req.headers['x-forwarded-for'] || 'unknown',
              res.statusCode
            ]
          );
        }
      } catch (err) {
        console.error('[Audit] Error al auditar token expirado:', err.message);
      }
    });

    return originalJson(data);
  };

  next();
};

module.exports = {
  auditLog,
  auditLoginAttempt,
  auditTokenExpired
};