/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Endpoints para gestionar usuarios
 */

const svc = require('../services/usuario.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       required:
 *         - nombre
 *         - correo
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del usuario
 *         nombre:
 *           type: string
 *         correo:
 *           type: string
 *           format: email
 *         numero:
 *           type: string
 *           nullable: true
 *         rol:
 *           type: integer
 *           nullable: true
 *         estado:
 *           type: boolean
 *         tipoDocumento:
 *           type: string
 *           nullable: true
 *         licencia:
 *           type: string
 *           nullable: true
 *         perfil:
 *           type: integer
 *           nullable: true
 *         rol_nombre:
 *           type: string
 *     UsuarioCreate:
 *       type: object
 *       required:
 *         - nombre
 *         - correo
 *         - contrasena
 *       properties:
 *         nombre:
 *           type: string
 *         correo:
 *           type: string
 *           format: email
 *         contrasena:
 *           type: string
 *         numero:
 *           type: string
 *           nullable: true
 *         rol:
 *           type: integer
 *           nullable: true
 *         estado:
 *           type: boolean
 *           default: true
 *         tipoDocumento:
 *           type: string
 *           nullable: true
 *         licencia:
 *           type: string
 *           nullable: true
 *         perfil:
 *           type: integer
 *           nullable: true
 *     UsuarioUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *         correo:
 *           type: string
 *           format: email
 *         numero:
 *           type: string
 *           nullable: true
 *         rol:
 *           type: integer
 *           nullable: true
 *         estado:
 *           type: boolean
 *         tipoDocumento:
 *           type: string
 *           nullable: true
 *         licencia:
 *           type: string
 *           nullable: true
 *         perfil:
 *           type: integer
 *           nullable: true
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de todos los usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
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
 * /usuarios/{id}:
 *   get:
 *     summary: Obtener un usuario por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       404:
 *         description: Usuario no encontrado
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
 * /usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioCreate'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Datos inválidos o faltantes
 *       409:
 *         description: El correo ya está registrado
 */
const create = async (req, res) => {
  try {
    const newUser = await svc.create(req.body);
    res.status(201).json(newUser);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     summary: Actualizar un usuario (parcial o total)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioUpdate'
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: El correo ya está en uso
 */
const update = async (req, res) => {
  try {
    const updated = await svc.update(req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /usuarios/{id}/contrasena:
 *   patch:
 *     summary: Cambiar la contraseña de un usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actual
 *               - nueva
 *             properties:
 *               actual:
 *                 type: string
 *               nueva:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Faltan datos
 *       401:
 *         description: Contraseña actual incorrecta
 *       404:
 *         description: Usuario no encontrado
 */
const cambiarContrasena = async (req, res) => {
  try {
    await svc.cambiarContrasena(req.params.id, req.body);
    res.json({ message: 'Contraseña actualizada' });
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /usuarios/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - contrasena
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *               contrasena:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 usuario:
 *                   $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Faltan credenciales
 *       401:
 *         description: Credenciales inválidas
 */
const login = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    const usuario = await svc.login(correo, contrasena);
    res.json({ message: 'Login exitoso', usuario });
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     summary: Eliminar un usuario por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       204:
 *         description: Usuario eliminado correctamente
 *       404:
 *         description: Usuario no encontrado
 */
const remove = async (req, res) => {
  try {
    await svc.remove(req.params.id);
    res.status(204).send();
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  cambiarContrasena,
  login,
  remove,
};