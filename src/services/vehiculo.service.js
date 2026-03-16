/**
 * @module VehiculoService
 * @description Lógica de negocio para la gestión de vehículos. 
 * Controla la vinculación de autos/motos con sus respectivos conductores.
 */

const repo          = require('../repositories/vehiculo.repository');
const conductorRepo = require('../repositories/conductor.repository');

/**
 * @swagger
 * components:
 * schemas:
 * Vehiculo:
 * type: object
 * required:
 * - conductor
 * - placa
 * properties:
 * id:
 * type: integer
 * description: ID único del vehículo.
 * conductor:
 * type: integer
 * description: ID del conductor (propietario/responsable).
 * placa:
 * type: string
 * description: Matrícula única del vehículo.
 * marca:
 * type: string
 * description: Marca del fabricante.
 * modelo:
 * type: string
 * description: Modelo o línea del vehículo.
 * color:
 * type: string
 * description: Color predominante.
 * tipo:
 * type: string
 * enum: [Carro, Moto, Bicicleta]
 * description: Categoría del vehículo.
 * example:
 * conductor: 3
 * placa: "KRS-123"
 * marca: "Mazda"
 * modelo: "CX-5"
 * tipo: "Carro"
 */

/**
 * Obtiene la lista global de vehículos.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca un vehículo por su ID.
 * @param {number} id 
 * @throws {Object} 404 si el vehículo no existe.
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Vehículo no encontrado' };
  return item;
};

/**
 * Obtiene todos los vehículos asociados a un conductor.
 * @param {number} conductorId 
 */
const getByConductor = (conductorId) => repo.findByConductor(conductorId);

/**
 * Registra un nuevo vehículo validando la placa y el conductor.
 * @param {Object} datos - { conductor, placa, marca, modelo, etc. }
 * @throws {Object} 400 datos faltantes, 404 conductor inexistente, 409 placa duplicada.
 */
const create = async (datos) => {
  if (!datos.conductor || !datos.placa)
    throw { status: 400, message: 'conductor y placa son requeridos' };

  const conductorExiste = await conductorRepo.findById(datos.conductor);
  if (!conductorExiste) throw { status: 404, message: 'Conductor no encontrado' };

  const placaExiste = await repo.findByPlaca(datos.placa);
  if (placaExiste) throw { status: 409, message: 'La placa ya está registrada' };

  return repo.create(datos);
};

/**
 * Actualiza la información del vehículo. 
 * Si se cambia la placa, valida que no pertenezca a otro vehículo.
 * @param {number} id 
 * @param {Object} datos 
 * @throws {Object} 409 si la nueva placa ya existe en otro ID.
 */
const update = async (id, datos) => {
  await getById(id);
  if (datos.placa) {
    const dup = await repo.findByPlaca(datos.placa);
    if (dup && dup.id != id) throw { status: 409, message: 'La placa ya está registrada' };
  }
  return repo.update(id, datos);
};

/**
 * Elimina un vehículo del sistema.
 * @param {number} id 
 */
const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, getByConductor, create, update, remove };