/**
 * @module ParqueaderoService
 * @description Lógica de negocio para la administración de sedes o instalaciones de parqueo.
 * Alineado con el modelo Parqueadero (nombre, ubicacion, celdas_totales, 
 * celdas_movilidad_reducida, celdas_motos, celdas_carros, estado).
 */

const repo = require('../repositories/parqueadero.repository');

/**
 * @swagger
 * components:
 *   schemas:
 *     Parqueadero:
 *       type: object
 *       required:
 *         - nombre
 *         - ubicacion
 *         - celdas_totales
 *         - celdas_movilidad_reducida
 *         - celdas_motos
 *         - celdas_carros
 *       properties:
 *         id:
 *           type: integer
 *           description: ID autoincremental del parqueadero.
 *         nombre:
 *           type: string
 *           description: Nombre del parqueadero.
 *         ubicacion:
 *           type: string
 *           nullable: true
 *           description: Ubicación física del parqueadero.
 *         celdas_totales:
 *           type: integer
 *           description: Total de celdas disponibles.
 *         celdas_movilidad_reducida:
 *           type: integer
 *           description: Total de celdas para movilidad reducida.
 *         celdas_motos:
 *           type: integer
 *           description: Total de celdas para motos.
 *         celdas_carros:
 *           type: integer
 *           description: Total de celdas para carros.
 *         estado:
 *           type: boolean
 *           default: true
 *           description: Estado del parqueadero (activo/inactivo).
 *     ParqueaderoCreate:
 *       type: object
 *       required:
 *         - nombre
 *         - celdas_totales
 *         - celdas_movilidad_reducida
 *         - celdas_motos
 *         - celdas_carros
 *       properties:
 *         nombre:
 *           type: string
 *         ubicacion:
 *           type: string
 *           nullable: true
 *         celdas_totales:
 *           type: integer
 *         celdas_movilidad_reducida:
 *           type: integer
 *         celdas_motos:
 *           type: integer
 *         celdas_carros:
 *           type: integer
 *         estado:
 *           type: boolean
 *           default: true
 *     ParqueaderoUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *         ubicacion:
 *           type: string
 *           nullable: true
 *         celdas_totales:
 *           type: integer
 *         celdas_movilidad_reducida:
 *           type: integer
 *         celdas_motos:
 *           type: integer
 *         celdas_carros:
 *           type: integer
 *         estado:
 *           type: boolean
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
 * @returns {Promise<Object>}
 */
const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Parqueadero no encontrado' };
  return item;
};

/**
 * Valida que los contadores de celdas sean consistentes.
 * @param {Object} data - Datos del parqueadero.
 * @throws {Object} 400 si los datos son inválidos.
 */
const validarCeldas = ({ celdas_totales, celdas_movilidad_reducida, celdas_motos, celdas_carros }) => {
  if (celdas_totales === undefined || celdas_totales === null) {
    throw { status: 400, message: 'El total de celdas es requerido' };
  }
  if (celdas_movilidad_reducida === undefined || celdas_movilidad_reducida === null) {
    throw { status: 400, message: 'El número de celdas para movilidad reducida es requerido' };
  }
  if (celdas_motos === undefined || celdas_motos === null) {
    throw { status: 400, message: 'El número de celdas para motos es requerido' };
  }
  if (celdas_carros === undefined || celdas_carros === null) {
    throw { status: 400, message: 'El número de celdas para carros es requerido' };
  }

  // Validar que los valores sean números positivos
  if (typeof celdas_totales !== 'number' || celdas_totales < 0) {
    throw { status: 400, message: 'El total de celdas debe ser un número positivo' };
  }
  if (typeof celdas_movilidad_reducida !== 'number' || celdas_movilidad_reducida < 0) {
    throw { status: 400, message: 'Las celdas de movilidad reducida deben ser un número positivo' };
  }
  if (typeof celdas_motos !== 'number' || celdas_motos < 0) {
    throw { status: 400, message: 'Las celdas para motos deben ser un número positivo' };
  }
  if (typeof celdas_carros !== 'number' || celdas_carros < 0) {
    throw { status: 400, message: 'Las celdas para carros deben ser un número positivo' };
  }

  // Validar que la suma de las celdas especiales no exceda el total
  const sumaEspeciales = celdas_movilidad_reducida + celdas_motos + celdas_carros;
  if (sumaEspeciales > celdas_totales) {
    throw { 
      status: 400, 
      message: `La suma de celdas especiales (${sumaEspeciales}) no puede exceder el total de celdas (${celdas_totales})` 
    };
  }
};

/**
 * Crea una nueva sede validando que el nombre sea único y los contadores de celdas sean consistentes.
 * @param {Object} data - Datos del parqueadero.
 * @param {string} data.nombre
 * @param {string} data.ubicacion
 * @param {number} data.celdas_totales
 * @param {number} data.celdas_movilidad_reducida
 * @param {number} data.celdas_motos
 * @param {number} data.celdas_carros
 * @param {boolean} [data.estado=true]
 * @throws {Object} 400 si faltan campos o son inválidos.
 * @throws {Object} 409 si el nombre ya está en uso.
 * @returns {Promise<Object>} Parqueadero creado.
 */
const create = async ({ nombre, ubicacion, celdas_totales, celdas_movilidad_reducida, celdas_motos, celdas_carros, estado = true }) => {
  // Validar nombre
  if (!nombre) throw { status: 400, message: 'El nombre es requerido' };
  
  // Verificar duplicidad de nombre
  const existe = await repo.findByNombre(nombre);
  if (existe) throw { status: 409, message: 'Ya existe un parqueadero con ese nombre' };
  
  // Validar contadores de celdas
  validarCeldas({ celdas_totales, celdas_movilidad_reducida, celdas_motos, celdas_carros });
  
  return repo.create({ nombre, ubicacion, celdas_totales, celdas_movilidad_reducida, celdas_motos, celdas_carros, estado });
};

/**
 * Actualiza los datos de una sede (parcial o total).
 * @param {number} id 
 * @param {Object} data - Campos a actualizar (todos opcionales).
 * @param {string} [data.nombre]
 * @param {string} [data.ubicacion]
 * @param {number} [data.celdas_totales]
 * @param {number} [data.celdas_movilidad_reducida]
 * @param {number} [data.celdas_motos]
 * @param {number} [data.celdas_carros]
 * @param {boolean} [data.estado]
 * @throws {Object} 404 si el parqueadero no existe.
 * @throws {Object} 409 si el nuevo nombre ya pertenece a otra sede.
 * @throws {Object} 400 si los contadores de celdas son inválidos.
 * @returns {Promise<Object>} Parqueadero actualizado.
 */
const update = async (id, data) => {
  // Verificar que el parqueadero existe
  await getById(id);
  
  // Validar duplicidad de nombre si se está actualizando
  if (data.nombre) {
    const dup = await repo.findByNombre(data.nombre);
    if (dup && dup.id !== id) {
      throw { status: 409, message: 'Ya existe un parqueadero con ese nombre' };
    }
  }
  
  // Si se envían contadores de celdas, validar consistencia
  // Para validación parcial, solo verificamos los campos que se envían
  if (data.celdas_totales !== undefined || 
      data.celdas_movilidad_reducida !== undefined || 
      data.celdas_motos !== undefined || 
      data.celdas_carros !== undefined) {
    
    // Obtener los valores actuales para completar la validación
    const actual = await repo.findById(id);
    const celdas_totales = data.celdas_totales !== undefined ? data.celdas_totales : actual.celdas_totales;
    const celdas_movilidad_reducida = data.celdas_movilidad_reducida !== undefined ? data.celdas_movilidad_reducida : actual.celdas_movilidad_reducida;
    const celdas_motos = data.celdas_motos !== undefined ? data.celdas_motos : actual.celdas_motos;
    const celdas_carros = data.celdas_carros !== undefined ? data.celdas_carros : actual.celdas_carros;
    
    validarCeldas({ celdas_totales, celdas_movilidad_reducida, celdas_motos, celdas_carros });
  }
  
  return repo.update(id, data);
};

/**
 * Elimina una sede del sistema.
 * @param {number} id 
 * @throws {Object} 404 si no existe.
 * @throws {Object} 409 si tiene celdas asociadas (integridad referencial).
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, create, update, remove };