/**
 * @module UploadMiddleware
 * @description Infraestructura de subida de archivos a disco local, reutilizada por la
 * foto de perfil de usuario (uploads/perfiles) y la evidencia de novedades
 * (uploads/evidencias). El despliegue de este proyecto es git pull + pm2 restart sobre
 * un VPS con disco persistente (ver deploy.sh) -- no contenedores efímeros -- por eso
 * disco local es una opción válida sin infraestructura externa nueva.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

/**
 * Crea un middleware Express que recibe un único archivo (multipart/form-data), lo valida
 * por extensión/tamaño y lo guarda en uploads/<subcarpeta>/<uuid>.<ext>.
 * @param {Object} opciones
 * @param {string} opciones.subcarpeta - p. ej. 'perfiles' o 'evidencias'.
 * @param {string[]} opciones.extensionesPermitidas - sin punto, en minúsculas.
 * @param {number} [opciones.limiteMB=5]
 * @param {string} [opciones.campo='archivo'] - nombre del campo multipart esperado.
 * @returns {import('express').RequestHandler}
 */
const crearUploadMiddleware = ({ subcarpeta, extensionesPermitidas, limiteMB = 5, campo = 'archivo' }) => {
  const destino = path.join(UPLOADS_ROOT, subcarpeta);
  fs.mkdirSync(destino, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, destino),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (!extensionesPermitidas.includes(ext)) {
      const error = new Error(`Extensión no permitida. Permitidas: ${extensionesPermitidas.join(', ')}`);
      return cb(error);
    }
    cb(null, true);
  };

  const upload = multer({ storage, fileFilter, limits: { fileSize: limiteMB * 1024 * 1024 } }).single(campo);

  // Envuelve multer para responder directamente ante sus errores (archivo muy grande,
  // extensión no permitida, campo inesperado) con un 400 legible. No se usa next(err):
  // eso saltaría directo al error handler global de src/index.js (que siempre responde
  // 500 genérico sin mirar .status), sin pasar por el controller ni por handleError.
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: `El archivo excede el tamaño máximo permitido (${limiteMB}MB)` });
      }
      return res.status(400).json({ message: err.message || 'Error al subir el archivo' });
    });
  };
};

/**
 * Ruta pública (servida por express.static en src/index.js) de un archivo ya guardado.
 * @param {string} subcarpeta
 * @param {string} nombreArchivo
 * @returns {string}
 */
const rutaPublica = (subcarpeta, nombreArchivo) => `/uploads/${subcarpeta}/${nombreArchivo}`;

/**
 * Borra (best-effort, no lanza) un archivo previamente guardado a partir de su ruta pública
 * (tal como quedó almacenada en BD), p. ej. al reemplazar una foto de perfil.
 * @param {string} rutaPublicaGuardada - p. ej. '/uploads/perfiles/<uuid>.jpg'.
 */
const eliminarArchivoSiExiste = (rutaPublicaGuardada) => {
  if (!rutaPublicaGuardada || !rutaPublicaGuardada.startsWith('/uploads/')) return;
  const rutaFisica = path.join(__dirname, '..', '..', rutaPublicaGuardada);
  fs.unlink(rutaFisica, () => {});
};

module.exports = { crearUploadMiddleware, rutaPublica, eliminarArchivoSiExiste, UPLOADS_ROOT };
