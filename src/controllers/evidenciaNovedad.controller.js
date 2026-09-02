const svc = require('../services/evidenciaNovedad.service');
const { handleError } = require('../helpers/errorHandler');
const { rutaPublica } = require('../middlewares/upload.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     EvidenciaNovedad:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         novedad_id:
 *           type: integer
 *         url:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [FOTO, VIDEO, DOCUMENTO, NOTA]
 *         descripcion:
 *           type: string
 *           nullable: true
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *     EvidenciaNovedadCreate:
 *       type: object
 *       required:
 *         - url
 *       properties:
 *         url:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [FOTO, VIDEO, DOCUMENTO, NOTA]
 *           default: FOTO
 *         descripcion:
 *           type: string
 *           nullable: true
 */

/**
 * @swagger
 * /novedades/{id}/evidencias:
 *   get:
 *     summary: Listar las evidencias de una novedad
 *     tags: [Novedades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de evidencias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EvidenciaNovedad'
 *       404:
 *         description: Novedad no encontrada
 */
const getByNovedad = async (req, res) => {
  try {
    res.json(await svc.getByNovedad(req.params.id));
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /novedades/{id}/evidencias:
 *   post:
 *     summary: Adjuntar una evidencia a una novedad
 *     tags: [Novedades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EvidenciaNovedadCreate'
 *     responses:
 *       201:
 *         description: Evidencia creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EvidenciaNovedad'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Novedad no encontrada
 */
const create = async (req, res) => {
  try {
    // Retrocompatible: si viene multipart con archivo (campo "archivo"), su URL pública
    // reemplaza cualquier `url` de texto que hubiera llegado en el cuerpo. Si no viene
    // archivo (JSON normal), se comporta exactamente igual que antes.
    const datos = { ...req.body };
    if (req.file) {
      datos.url = rutaPublica('evidencias', req.file.filename);
    }
    const nueva = await svc.create(req.params.id, datos);
    res.status(201).json(nueva);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /evidencias/{id}:
 *   delete:
 *     summary: Eliminar una evidencia
 *     tags: [Novedades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Evidencia eliminada
 *       404:
 *         description: Evidencia no encontrada
 */
const remove = async (req, res) => {
  try {
    await svc.remove(req.params.id);
    res.status(204).send();
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = { getByNovedad, create, remove };
