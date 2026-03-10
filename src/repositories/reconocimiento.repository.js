/**
 * @module reconocimientoRepository
 * @description
 * Repository encargado de manejar el acceso a datos
 * del reconocimiento automático de placas.
 */

let reconocimientos = [];
let idCounter = 1;

/**
 * Obtener todos los reconocimientos
 */
const getAll = () => reconocimientos;

/**
 * Obtener reconocimiento por ID
 */
const getById = (id) =>
  reconocimientos.find(r => r.id_reconocimiento === id);

/**
 * Crear reconocimiento
 */
const create = (data) => {

  const reconocimiento = {
    id_reconocimiento: idCounter++,
    ...data
  };

  reconocimientos.push(reconocimiento);

  return reconocimiento;
};

/**
 * Eliminar reconocimiento
 */
const deleteById = (id) => {

  const index = reconocimientos.findIndex(
    r => r.id_reconocimiento === id
  );

  if (index === -1) return null;

  return reconocimientos.splice(index, 1)[0];
};

module.exports = {
  getAll,
  getById,
  create,
  deleteById
};