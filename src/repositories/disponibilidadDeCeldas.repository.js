const DisponibilidadCelda = require("../models/DisponibilidadCelda");

/**
 * Arreglo que almacena las disponibilidades en memoria
 * @type {Array<Object>}
 */
let disponibilidades = [];

/**
 * Contador para generar IDs automáticos
 * @type {number}
 */
let idCounter = 1;

/**
 * Listar todas las disponibilidades
 * @returns {Array<Object>}
 */
const listar = () => {
  return disponibilidades;
};

/**
 * Consultar disponibilidad por ID
 * @param {number} id
 * @returns {Object|null}
 */
const consultar = (id) => {
  return disponibilidades.find(d => d.id_disponibilidad == id);
};

/**
 * Visualizar disponibilidad
 * @param {number} id
 * @returns {Object|null}
 */
const visualizar = (id) => {
  return disponibilidades.find(d => d.id_disponibilidad == id);
};

/**
 * Editar disponibilidad
 * @param {number} id
 * @param {Object} data
 * @returns {Object|null}
 */
const editar = (id, data) => {

  const disponibilidad = disponibilidades.find(d => d.id_disponibilidad == id);

  if (!disponibilidad) {
    return null;
  }

  disponibilidad.id_celda = data.id_celda ?? disponibilidad.id_celda;
  disponibilidad.estado = data.estado ?? disponibilidad.estado;
  disponibilidad.fecha_actualizacion = data.fecha_actualizacion ?? disponibilidad.fecha_actualizacion;
  disponibilidad.hora_actualizacion = data.hora_actualizacion ?? disponibilidad.hora_actualizacion;

  return disponibilidad;
};

/**
 * Crear disponibilidad (opcional para pruebas)
 */
const crear = (data) => {

  const nuevaDisponibilidad = new DisponibilidadCelda(
    idCounter++,
    data.id_celda,
    data.estado,
    data.fecha_actualizacion,
    data.hora_actualizacion
  );

  disponibilidades.push(nuevaDisponibilidad);

  return nuevaDisponibilidad;
};

module.exports = {
  listar,
  consultar,
  visualizar,
  editar,
  crear
};