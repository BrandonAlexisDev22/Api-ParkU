/**
 * @module ParqueaderoService
 * @description Lógica de negocio para la administración de sedes o instalaciones de parqueo.
 */

const repo = require('../repositories/parqueadero.repository');

/**
 * @swagger
 * components:
 * schemas:
 * Parqueadero:
 * type: object
 * required:
 * - nombre
 * properties:
 * id:
 * type: integer
 * description: ID único de la sede.
 * nombre:
 * type: string
 * description: Nombre identificador del parqueadero (ej. Sede Norte).
 * ubicacion:
 * type: string
 * description: Dirección física o coordenadas.
 * descripcion:
 * type: string
 * description: Detalles adicionales sobre la sede.
 * example:
 * id: 1
 * nombre: "ParkU Central"
 * ubicacion: "Calle 45 #12-34"
 * descripcion: "Sede principal con 3 niveles"
 */

/**
 * Obtiene todas las sedes registradas.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca una sede por su ID.
 * @param {number} id 
 * @throws {Object} 404 si no existe.
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Parqueadero no encontrado' };
  return item;
};

/**
 * Crea una nueva sede validando que el nombre sea único.
 * @param {Object} data - { nombre, ubicacion, descripcion }
 * @throws {Object} 400 si falta el nombre, 409 si el nombre ya está en uso.
 */
const create = async ({ nombre, ubicacion, descripcion }) => {
  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };
  
  const existe = await repo.findByNombre(nombre);
  if (existe) throw { status: 409, message: 'Ya existe un parqueadero con ese nombre' };
  
  return repo.create({ nombre, ubicacion, descripcion });
};

/**
 * Actualiza los datos de una sede.
 * @param {number} id 
 * @param {Object} datos 
 * @throws {Object} 409 si el nuevo nombre ya pertenece a otra sede.
 */
const update = async (id, datos) => {
  await getById(id);
  
  if (datos.nombre) {
    const dup = await repo.findByNombre(datos.nombre);
    // Validar que el nombre no lo tenga OTRA sede diferente a la actual
    if (dup && dup.id != id) {
      throw { status: 409, message: 'Ya existe un parqueadero con ese nombre' };
    }
  }
  
  return repo.update(id, datos);
};

/**
 * Elimina una sede del sistema.
 * @param {number} id 
 */
const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, create, update, remove };