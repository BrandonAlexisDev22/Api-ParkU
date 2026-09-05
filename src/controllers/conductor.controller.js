/**
 * @swagger
 * tags:
 *   name: Conductores
 *   description: Endpoints para gestionar conductores
 */

const svc = require('../services/conductor.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     Conductor:
 *       type: object
 *       required:
 *         - numero_documento
 *         - nombre_apellidos
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental del conductor.
 *         usuario_id:
 *           type: integer
 *           nullable: true
 *           description: ID de la cuenta de usuario asociada (opcional).
 *         tipo_documento:
 *           type: string
 *           enum: [CC, CE, TI, PASAPORTE, PEP, NIT]
 *           default: CC
 *         numero_documento:
 *           type: string
 *           description: Número de documento (único junto con tipo_documento).
 *         nombre_apellidos:
 *           type: string
 *         correo:
 *           type: string
 *           format: email
 *           nullable: true
 *         direccion:
 *           type: string
 *           nullable: true
 *         numero_telefonico:
 *           type: string
 *           nullable: true
 *         tipo_usuario_id:
 *           type: integer
 *         regional_formacion:
 *           type: string
 *           nullable: true
 *           description: >
 *             Solo lectura. Dato histórico de SOFIA Plus: ya no se pide en los formularios
 *             de alta ni de edición (se ignora si se envía), pero lo ya guardado se
 *             conserva y se sigue devolviendo. Igual para centro_formacion y
 *             programa_formacion.
 *         centro_formacion:
 *           type: string
 *           nullable: true
 *         programa_formacion:
 *           type: string
 *           nullable: true
 *         vigencia:
 *           type: string
 *           format: date
 *           nullable: true
 *         movilidad_reducida:
 *           type: boolean
 *           default: false
 *         tipo_discapacidad:
 *           type: string
 *           nullable: true
 *           description: Solo válido si movilidad_reducida es true.
 *         estado:
 *           type: boolean
 *           default: true
 *         tipo_usuario_nombre:
 *           type: string
 *           description: Solo en respuestas (JOIN).
 *         usuario_correo:
 *           type: string
 *           description: Solo en respuestas (JOIN).
 *     ConductorCreate:
 *       type: object
 *       required:
 *         - numero_documento
 *         - nombre_apellidos
 *       properties:
 *         usuario_id:
 *           type: integer
 *           nullable: true
 *           description: >
 *             Cuenta de acceso YA EXISTENTE a la que vincular el conductor ("sí tiene
 *             cuenta"). Excluyente con crear_cuenta y con sin_cuenta.
 *         crear_cuenta:
 *           type: boolean
 *           nullable: true
 *           description: >
 *             "No tiene cuenta": crea la cuenta de acceso del conductor. Requiere correo,
 *             numero_telefonico, contrasena y confirmar_contrasena. Si ese correo ya tiene
 *             cuenta responde 409 con su usuario_id, para que el formulario la seleccione
 *             en vez de duplicarla. La cuenta y el conductor se escriben en la misma
 *             transacción: si el conductor falla, la cuenta nueva también se revierte.
 *         sin_cuenta:
 *           type: boolean
 *           nullable: true
 *           description: >
 *             Registra al conductor SIN cuenta de acceso (usuario_id null). Correo y
 *             teléfono pasan a ser opcionales. Es el caso del visitante al que el vigilante
 *             registra para poder parquearlo.
 *         contrasena:
 *           type: string
 *           nullable: true
 *           description: Requerida con crear_cuenta. Misma política que el registro público (8+, mayúscula, minúscula y número).
 *         confirmar_contrasena:
 *           type: string
 *           nullable: true
 *           description: Requerida con crear_cuenta; debe coincidir exactamente con contrasena.
 *         tipo_documento:
 *           type: string
 *           enum: [CC, CE, TI, PASAPORTE, PEP, NIT]
 *           default: CC
 *         numero_documento:
 *           type: string
 *         nombre_apellidos:
 *           type: string
 *         correo:
 *           type: string
 *           format: email
 *           nullable: true
 *         direccion:
 *           type: string
 *           nullable: true
 *         numero_telefonico:
 *           type: string
 *           nullable: true
 *         tipo_usuario_id:
 *           type: integer
 *           nullable: true
 *           description: >
 *             Perfil dentro del SENA (Aprendiz/Instructor/Administrativo). Es un dato del
 *             CONDUCTOR, no de la cuenta de acceso: la tabla usuario no tiene ningún campo
 *             equivalente, así que no debe aparecer en los formularios de usuario. Opcional.
 *         vigencia:
 *           type: string
 *           format: date
 *           nullable: true
 *         movilidad_reducida:
 *           type: boolean
 *           default: false
 *         tipo_discapacidad:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: boolean
 *           default: true
 *     ConductorUpdate:
 *       type: object
 *       properties:
 *         usuario_id:
 *           type: integer
 *           nullable: true
 *         tipo_documento:
 *           type: string
 *           enum: [CC, CE, TI, PASAPORTE, PEP, NIT]
 *         numero_documento:
 *           type: string
 *         nombre_apellidos:
 *           type: string
 *         correo:
 *           type: string
 *           format: email
 *           nullable: true
 *         direccion:
 *           type: string
 *           nullable: true
 *         numero_telefonico:
 *           type: string
 *           nullable: true
 *         tipo_usuario_id:
 *           type: integer
 *           nullable: true
 *           description: >
 *             Perfil dentro del SENA (Aprendiz/Instructor/Administrativo). Es un dato del
 *             CONDUCTOR, no de la cuenta de acceso: la tabla usuario no tiene ningún campo
 *             equivalente, así que no debe aparecer en los formularios de usuario. Opcional.
 *         vigencia:
 *           type: string
 *           format: date
 *           nullable: true
 *         movilidad_reducida:
 *           type: boolean
 *         tipo_discapacidad:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: boolean
 */

/**
 * @swagger
 * /conductores:
 *   get:
 *     summary: Obtener todos los conductores
 *     tags: [Conductores]
 *     responses:
 *       200:
 *         description: Lista de todos los conductores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conductor'
 */
const getAll = async (req, res) => {
  try {
    const data = await svc.getAll();
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /conductores/activos:
 *   get:
 *     summary: Obtener solo los conductores activos
 *     tags: [Conductores]
 *     responses:
 *       200:
 *         description: Lista de conductores con estado = true
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conductor'
 */
const getActivos = async (req, res) => {
  try {
    const data = await svc.getActivos();
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /conductores/documento:
 *   get:
 *     summary: Buscar un conductor por tipo y número de documento
 *     tags: [Conductores]
 *     parameters:
 *       - in: query
 *         name: tipo_documento
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CC, CE, PAS, TI, NIT]
 *       - in: query
 *         name: numero_documento
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conductor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conductor'
 *       400:
 *         description: Faltan parámetros
 *       404:
 *         description: No existe conductor con ese documento
 */
const getByDocumento = async (req, res) => {
  try {
    const { tipo_documento, numero_documento } = req.query;
    if (!tipo_documento || !numero_documento) {
      return res.status(400).json({ message: 'tipo_documento y numero_documento son requeridos' });
    }
    const data = await svc.getByDocumento(tipo_documento, numero_documento);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /conductores/correo/{correo}:
 *   get:
 *     summary: Buscar conductores por correo electrónico
 *     tags: [Conductores]
 *     parameters:
 *       - in: path
 *         name: correo
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Correo electrónico
 *     responses:
 *       200:
 *         description: Lista de conductores con ese correo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conductor'
 */
const getByCorreo = async (req, res) => {
  try {
    const data = await svc.getByCorreo(req.params.correo);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /conductores/usuario/{usuarioId}:
 *   get:
 *     summary: Obtener el conductor vinculado a una cuenta de usuario (incluye su documento)
 *     tags: [Conductores]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conductor vinculado a ese usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conductor'
 *       404:
 *         description: Ese usuario no tiene un conductor vinculado
 */
const getByUsuarioId = async (req, res) => {
  try {
    const data = await svc.getByUsuarioId(req.params.usuarioId);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /conductores/{id}:
 *   get:
 *     summary: Obtener un conductor por ID
 *     tags: [Conductores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor
 *     responses:
 *       200:
 *         description: Conductor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conductor'
 *       404:
 *         description: Conductor no encontrado
 */
const getById = async (req, res) => {
  try {
    const data = await svc.getById(req.params.id);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /conductores:
 *   post:
 *     summary: Crear un nuevo conductor
 *     tags: [Conductores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConductorCreate'
 *     responses:
 *       201:
 *         description: Conductor creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conductor'
 *       400:
 *         description: Datos inválidos o faltantes
 *       404:
 *         description: Alguna referencia (usuario/catálogo) no existe
 *       409:
 *         description: Documento o correo ya registrado
 */
const create = async (req, res) => {
  try {
    const newConductor = await svc.create(req.body);
    res.status(201).json(newConductor);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /conductores/{id}:
 *   put:
 *     summary: Actualizar un conductor (parcial o total)
 *     tags: [Conductores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConductorUpdate'
 *     responses:
 *       200:
 *         description: Conductor actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conductor'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Conductor no encontrado
 *       409:
 *         description: Conflicto con documento o correo duplicado
 */
const update = async (req, res) => {
  try {
    const updated = await svc.update(req.params.id, req.body, req.usuario?.id);
    res.json(updated);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /conductores/{id}:
 *   delete:
 *     summary: Eliminar un conductor por ID
 *     tags: [Conductores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor
 *     responses:
 *       204:
 *         description: Conductor eliminado correctamente
 *       404:
 *         description: Conductor no encontrado
 */
const remove = async (req, res) => {
  try {
    await svc.remove(req.params.id);
    res.status(204).send();
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /conductores/{id}/usuario:
 *   delete:
 *     summary: Cancela la vinculación del conductor con su cuenta de usuario
 *     description: >
 *       Deshace la asociación sin borrar nada: el conductor conserva sus datos, vehículos
 *       e historial, y la cuenta de usuario sigue existiendo. Pensado para cuando se
 *       selecciona la cuenta equivocada al crear el conductor; como usuario_id es UNIQUE,
 *       sin esto la cuenta quedaba atrapada y no podía vincularse a quien correspondía.
 *     tags: [Conductores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conductor ya desvinculado (usuario_id en null)
 *       404:
 *         description: Conductor no encontrado
 *       409:
 *         description: El conductor no tenía ninguna cuenta vinculada
 */
const desvincularUsuario = async (req, res) => {
  try {
    const actualizado = await svc.desvincularUsuario(req.params.id);
    res.json(actualizado);
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = {
  getAll,
  getById,
  getActivos,
  getByDocumento,
  getByCorreo,
  getByUsuarioId,
  create,
  update,
  desvincularUsuario,
  remove,
};
