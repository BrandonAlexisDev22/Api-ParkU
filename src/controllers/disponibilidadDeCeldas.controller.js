const disponibilidadService = require("../services/disponibilidadCeldaService");

/**
 * Listar todas las disponibilidades de celdas
 */
const listar = (req, res) => {

  const disponibilidades = disponibilidadService.getDisponibilidades();

  res.json(disponibilidades);

};

/**
 * Consultar disponibilidad por ID
 */
const consultar = (req, res) => {

  const id = req.params.id;

  const disponibilidad = disponibilidadService.getDisponibilidadById(id);

  if (!disponibilidad) {
    return res.status(404).json({ mensaje: "Disponibilidad no encontrada" });
  }

  res.json(disponibilidad);

};

/**
 * Visualizar disponibilidad (puede usarse para mostrar información detallada)
 */
const visualizar = (req, res) => {

  const id = req.params.id;

  const disponibilidad = disponibilidadService.getDisponibilidadById(id);

  if (!disponibilidad) {
    return res.status(404).json({ mensaje: "Disponibilidad no encontrada" });
  }

  res.json(disponibilidad);

};

/**
 * Editar disponibilidad de una celda
 */
const editar = (req, res) => {

  const id = req.params.id;

  const disponibilidadActualizada = disponibilidadService.updateDisponibilidad(id, req.body);

  if (!disponibilidadActualizada) {
    return res.status(404).json({ mensaje: "Disponibilidad no encontrada" });
  }

  res.json(disponibilidadActualizada);

};

module.exports = {
  listar,
  consultar,
  visualizar,
  editar
};