/**
 * @module ReporteService
 * @description Gestión de reportes, incidentes y novedades dentro de los parqueaderos.
 * Permite documentar situaciones asociadas a vehículos o sedes específicas.
 */

const repo      = require('../repositories/reporte.repository');
const parqRepo  = require('../repositories/parqueadero.repository');
const vehRepo   = require('../repositories/vehiculo.repository');

/**
 * @swagger
 * components:
 * schemas:
 * Reporte:
 * type: object
 * required:
 * - descripcion
 * properties:
 * id:
 * type: integer
 * description: ID único del reporte.
 * descripcion:
 * type: string
 * description: Detalle del suceso o novedad.
 * parqueadero:
 * type: integer
 * nullable: true
 * description: ID del parqueadero donde ocurrió el evento.
 * vehiculo:
 * type: integer
 * nullable: true
 * description: ID del vehículo involucrado.
 * evidencia:
 * type: string
 * description: URL o ruta de la imagen/archivo de evidencia.
 * fecha_creacion:
 * type: string
 * format: date-time
 * description: Fecha y hora del registro.
 * example:
 * descripcion: "Vehículo mal estacionado obstruyendo salida"
 * parqueadero: 2
 * vehiculo: 15
 * evidencia: "https://storage.parku.com/evidencia123.jpg"
 */

/**
 * Obtiene todos los reportes registrados.
 * @returns {Promise<Array>}
 */
const getAll = () => repo.findAll();

/**
 * Busca un reporte por su ID.
 * @param {number} id 
 * @throws {Object} 404 si el reporte no existe.
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Reporte no encontrado' };
  return item;
};

/**
 * Filtra los reportes por una sede específica.
 * @param {number} parqueaderoId 
 */
const getByParqueadero = (parqueaderoId) => repo.findByParqueadero(parqueaderoId);

/**
 * Crea un nuevo reporte validando la existencia de las entidades relacionadas.
 * @param {Object} data - { descripcion, parqueadero, vehiculo, evidencia }
 * @throws {Object} 404 si el parqueadero o el vehículo indicados no existen.
 */
const create = async ({ descripcion, parqueadero, vehiculo, evidencia }) => {
  if (parqueadero) {
    const p = await parqRepo.findById(parqueadero);
    if (!p) throw { status: 404, message: 'Parqueadero no encontrado' };
  }
  
  if (vehiculo) {
    const v = await vehRepo.findById(vehiculo);
    if (!v) throw { status: 404, message: 'Vehículo no encontrado' };
  }
  
  return repo.create({ descripcion, parqueadero, vehiculo, evidencia });
};

/**
 * Actualiza la información de un reporte.
 * @param {number} id 
 * @param {Object} datos 
 */
const update = async (id, datos) => {
  await getById(id);
  return repo.update(id, datos);
};

/**
 * Elimina un reporte del sistema.
 * @param {number} id 
 */
const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, getByParqueadero, create, update, remove };