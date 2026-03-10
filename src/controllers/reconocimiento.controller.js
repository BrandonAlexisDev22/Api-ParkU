/**
 * @module reconocimientoService
 * @description
 * Maneja la lógica de negocio del reconocimiento
 * automático de placas de vehículos.
 */

const reconocimientoRepository = require('../repositories/reconocimiento.repository');

/**
 * Registrar reconocimiento de placa
 */
const createReconocimiento = (data) => {

  if (!data.placa) {
    throw new Error("La placa es obligatoria");
  }

  if (!data.fecha_hora) {
    data.fecha_hora = new Date();
  }

  return reconocimientoRepository.create(data);
};

/**
 * Obtener todos los registros
 */
const getReconocimientos = () =>
  reconocimientoRepository.getAll();

/**
 * Obtener registro por ID
 */
const getReconocimientoById = (id) => {

  const reconocimiento = reconocimientoRepository.getById(id);

  if (!reconocimiento) {
    throw new Error("El reconocimiento no existe");
  }

  return reconocimiento;
};

/**
 * Eliminar registro
 */
const deleteReconocimiento = (id) => {

  const reconocimiento = reconocimientoRepository.getById(id);

  if (!reconocimiento) {
    throw new Error("El reconocimiento no existe");
  }

  return reconocimientoRepository.deleteById(id);
};

module.exports = {
  createReconocimiento,
  getReconocimientos,
  getReconocimientoById,
  deleteReconocimiento
};