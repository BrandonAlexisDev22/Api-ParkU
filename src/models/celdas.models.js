/**
 * ============================================================
 * @module CeldaModel
 * @description
 * Modelo de datos para la entidad "Celda" (espacio de estacionamiento).
 * Define la estructura y validaciones de una celda dentro de un parqueadero,
 * incluyendo su tipo, usabilidad y estado actual.
 * 
 * @requires sequelize - ORM para la definición del modelo y conexión a BD
 * @requires ../config/database - Configuración de conexión a la base de datos
 * ============================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modelo Celda
 * @class Celda
 * @classdesc Representa un espacio de estacionamiento individual dentro de un parqueadero.
 * Cada celda tiene un tipo de vehículo permitido, una categoría de usabilidad,
 * y un estado que indica su disponibilidad.
 * 
 * @property {number} id - Identificador único de la celda (autoincrementable)
 * @property {number} parqueadero - ID del parqueadero al que pertenece la celda
 * @property {string} tipo - Tipo de vehículo permitido: CARRO, MOTO, MOVILIDAD_REDUCIDA, BICICLETA
 * @property {string} usabilidad - Categoría de uso: GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA
 * @property {string} estado_celda - Estado actual: DISPONIBLE, OCUPADO, MANTENIMIENTO, INACTIVA
 */
const Celda = sequelize.define('Celda', {
  /**
   * ID único de la celda
   * @type {number}
   * @primaryKey
   * @autoIncrement
   */
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  /**
   * ID del parqueadero al que pertenece esta celda
   * @type {number}
   * @required
   * @foreignKey - Relaciona con el modelo Parqueadero
   */
  parqueadero: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  /**
   * Tipo de vehículo que puede ocupar la celda
   * @type {string}
   * @enum {CARRO, MOTO, MOVILIDAD_REDUCIDA, BICICLETA}
   * @required
   */
  tipo: {
    type: DataTypes.ENUM('CARRO', 'MOTO', 'MOVILIDAD_REDUCIDA', 'BICICLETA'),
    allowNull: false,
  },

  /**
   * Categoría de usabilidad de la celda
   * @type {string}
   * @enum {GENERAL, EJECUTIVO, MOVILIDAD_REDUCIDA}
   * @required
   * @description
   * - GENERAL: Uso estándar para cualquier usuario
   * - EJECUTIVO: Reservado para usuarios VIP o premium
   * - MOVILIDAD_REDUCIDA: Espacio adaptado para personas con discapacidad
   */
  usabilidad: {
    type: DataTypes.ENUM('GENERAL', 'EJECUTIVO', 'MOVILIDAD_REDUCIDA'),
    allowNull: false,
  },

  /**
   * Estado operativo actual de la celda
   * @type {string}
   * @enum {DISPONIBLE, OCUPADO, MANTENIMIENTO, INACTIVA}
   * @required
   * @description
   * - DISPONIBLE: Libre para ser ocupada
   * - OCUPADO: Actualmente en uso por un vehículo
   * - MANTENIMIENTO: Fuera de servicio por reparaciones
   * - INACTIVA: Deshabilitada permanentemente
   */
  estado_celda: {
    type: DataTypes.ENUM('DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO', 'INACTIVA'),
    allowNull: false,
  },
}, {
  /**
   * Configuración adicional del modelo
   * @property {string} tableName - Nombre de la tabla en la base de datos
   * @property {boolean} timestamps - Habilita/deshabilita campos automáticos created_at/updated_at
   */
  tableName: 'celda',
  timestamps: false, // pon true si tu tabla tiene created_at/updated_at
});

/**
 * @exports Celda
 * @description Exporta el modelo para ser utilizado en otros módulos
 * @example
 * // Importar y usar el modelo
 * const Celda = require('./models/CeldaModel');
 * 
 * // Crear una nueva celda
 * const nuevaCelda = await Celda.create({
 *   parqueadero: 1,
 *   tipo: 'CARRO',
 *   usabilidad: 'GENERAL',
 *   estado_celda: 'DISPONIBLE'
 * });
 * 
 * // Buscar celdas disponibles
 * const celdasDisponibles = await Celda.findAll({
 *   where: { estado_celda: 'DISPONIBLE' }
 * });
 */
module.exports = Celda;