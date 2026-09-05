const svc = require('../services/usuario.service');
const { handleError } = require('../helpers/errorHandler');

const getAll = async (req, res) => {
  try {
    // ?rol=2 o ?rol=Vigilante o ?rol_id=2 filtran por cualquier rol existente en la BD.
    // Sin parámetro devuelve todos, como antes.
    const data = await svc.getAll({ rol: req.query.rol, rol_id: req.query.rol_id });
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

const getDatosVinculacion = async (req, res) => {
  try {
    const data = await svc.getDatosVinculacion(req.params.id);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * GET /api/usuarios/disponibilidad - Comprobación "mientras se escribe" para los
 * formularios de cuenta y de conductor. Acepta correo, numero_telefonico y/o
 * tipo_documento + numero_documento, y excluir_usuario_id al editar una cuenta.
 */
const disponibilidad = async (req, res) => {
  try {
    const data = await svc.comprobarDisponibilidad({
      correo: req.query.correo,
      numero_telefonico: req.query.numero_telefonico ?? req.query.numero,
      tipo_documento: req.query.tipo_documento ?? req.query.tipoDocumento,
      numero_documento: req.query.numero_documento ?? req.query.numeroDocumento,
      excluir_usuario_id: req.query.excluir_usuario_id ?? req.query.excluirUsuarioId,
    });
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

const getById = async (req, res) => {
  try {
    const data = await svc.getById(req.params.id);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

const create = async (req, res) => {
  try {
    const newUser = await svc.create(req.body);
    res.status(201).json(newUser);
  } catch (e) {
    handleError(res, e);
  }
};

const update = async (req, res) => {
  try {
    const updated = await svc.update(req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    handleError(res, e);
  }
};

/** El id sale del token: nadie puede editar la cuenta de otro por esta vía. */
const actualizarPerfil = async (req, res) => {
  try {
    const actualizado = await svc.actualizarPerfil(req.usuario.id, req.body);
    res.json(actualizado);
  } catch (e) {
    handleError(res, e);
  }
};

const actualizarFoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'El archivo de la foto es requerido (campo "foto")' });
    }
    const rutaPublica = `/uploads/perfiles/${req.file.filename}`;
    const usuario = await svc.actualizarFoto(req.usuario.id, rutaPublica);
    res.json(usuario);
  } catch (e) {
    handleError(res, e);
  }
};

const cambiarContrasena = async (req, res) => {
  try {
    await svc.cambiarContrasena(req.params.id, req.body);
    res.json({ message: 'Contraseña actualizada' });
  } catch (e) {
    handleError(res, e);
  }
};

const remove = async (req, res) => {
  try {
    await svc.remove(req.params.id, req.usuario?.id);
    res.status(204).send();
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = {
  getAll,
  getById,
  getDatosVinculacion,
  disponibilidad,
  create,
  update,
  actualizarPerfil,
  actualizarFoto,
  cambiarContrasena,
  remove,
};