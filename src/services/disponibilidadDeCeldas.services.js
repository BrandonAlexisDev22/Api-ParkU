const disponibilidadRepository = require("../repositories/disponibilidadDeCeldasRepository");

/**
 * Listar disponibilidades
 */
const listar = () => {
  return disponibilidadRepository.listar();
};

/**
 * Consultar disponibilidad por ID
 */
const consultar = (id) => {
  return disponibilidadRepository.consultar(id);
};

/**
 * Visualizar disponibilidad
 */
const visualizar = (id) => {
  return disponibilidadRepository.visualizar(id);
};

/**
 * Editar disponibilidad
 */
const editar = (id, data) => {
  return disponibilidadRepository.editar(id, data);
};

module.exports = {
  listar,
  consultar,
  visualizar,
  editar
};