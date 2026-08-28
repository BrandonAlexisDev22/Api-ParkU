/**
 * @module VehiculoRepository
 * @description Capa de acceso a datos para la tabla 'vehiculo'.
 * La propiedad ya no es una FK directa: vive en 'detalle_propiedad' (M:N con conductor).
 * Toda escritura sobre vehiculo requiere contexto de usuario (auditoría vía trigger) --
 * ver vehiculo.service.js y dbContext.util.js.
 */

const { Vehiculo, Conductor, DetallePropiedad } = require('../models');

const includeConductores = {
  model: Conductor,
  as: 'conductores',
  attributes: ['id', 'nombre_apellidos'],
  through: { attributes: ['es_principal'] },
};

/**
 * Aplana el resultado de Sequelize: agrega conductor_principal_id/nombre de solo lectura.
 * @param {import('sequelize').Model} instancia
 * @returns {Object|null}
 */
const mapVehiculo = (instancia) => {
  if (!instancia) return null;
  const plano = instancia.toJSON();
  const { conductores = [], ...resto } = plano;
  const principal = conductores.find((c) => c.DetallePropiedad?.es_principal) || conductores[0];
  return {
    ...resto,
    conductores,
    conductor_principal_id: principal ? principal.id : null,
    conductor_principal_nombre: principal ? principal.nombre_apellidos : null,
  };
};

/**
 * Obtiene el listado completo de vehículos con sus propietarios.
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  const rows = await Vehiculo.findAll({ include: [includeConductores], order: [['placa', 'ASC']] });
  return rows.map(mapVehiculo);
};

/**
 * Busca un vehículo por su ID interno.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const row = await Vehiculo.findByPk(id, { include: [includeConductores] });
  return mapVehiculo(row);
};

/**
 * Busca un vehículo por su placa (identificador único externo).
 * @param {string} placa
 * @returns {Promise<Object|null>}
 */
const findByPlaca = async (placa) => {
  const row = await Vehiculo.findOne({ where: { placa }, include: [includeConductores] });
  return mapVehiculo(row);
};

/**
 * Recupera todos los vehículos registrados bajo un mismo conductor.
 * @param {number} conductorId
 * @returns {Promise<Array>}
 */
const findByConductor = async (conductorId) => {
  const conductor = await Conductor.findByPk(conductorId, {
    include: [{ model: Vehiculo, as: 'vehiculos', through: { attributes: ['es_principal'] } }],
  });
  if (!conductor) return [];
  return conductor.vehiculos.map((v) => v.toJSON());
};

/**
 * Registra un nuevo vehículo y, si se indica un conductor, su propiedad principal.
 * @param {Object} data - { conductor_id?, placa, tipo, marca, ... }
 * @param {import('sequelize').Transaction} opciones.transaction
 * @returns {Promise<Object>} El vehículo creado con sus propietarios.
 */
const create = async ({ conductor_id, ...data }, { transaction } = {}) => {
  const nuevo = await Vehiculo.create(data, { transaction });

  if (conductor_id) {
    await DetallePropiedad.create(
      { conductor_id, vehiculo_id: nuevo.id, es_principal: true },
      { transaction }
    );
  }

  return findById(nuevo.id);
};

/**
 * Actualiza parcialmente un vehículo existente.
 * @param {number} id
 * @param {Object} data - Campos a actualizar (todos opcionales).
 * @param {import('sequelize').Transaction} opciones.transaction
 * @returns {Promise<Object>}
 */
const update = async (id, data, { transaction } = {}) => {
  const allowedFields = [
    'placa', 'tipo', 'tarjeta_propiedad', 'marca', 'linea', 'modelo', 'cilindraje',
    'color', 'servicio', 'carroceria', 'combustible', 'capacidad', 'numero_motor',
    'numero_chasis', 'observaciones', 'vehiculo_sena', 'estado',
  ];
  const cambios = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) cambios[field] = data[field];
  }
  if (Object.keys(cambios).length === 0) {
    return findById(id);
  }
  await Vehiculo.update(cambios, { where: { id }, transaction });
  return findById(id);
};

/**
 * Elimina un vehículo del sistema.
 * @param {number} id
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<boolean>}
 */
const remove = async (id, { transaction } = {}) => {
  const filasEliminadas = await Vehiculo.destroy({ where: { id }, transaction });
  return filasEliminadas > 0;
};

/**
 * Busca el vínculo de propiedad entre un vehículo y un conductor puntual, si existe.
 * @param {number} vehiculoId
 * @param {number} conductorId
 * @returns {Promise<import('sequelize').Model|null>}
 */
const findPropietario = (vehiculoId, conductorId) =>
  DetallePropiedad.findOne({ where: { vehiculo_id: vehiculoId, conductor_id: conductorId } });

/**
 * Vincula un conductor adicional como copropietario de un vehículo ya existente (no
 * reemplaza al propietario principal fijado en `create`).
 * @param {number} vehiculoId
 * @param {number} conductorId
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<Object>} El vehículo con la lista de propietarios actualizada.
 */
const agregarPropietario = async (vehiculoId, conductorId, { transaction } = {}) => {
  await DetallePropiedad.create(
    { conductor_id: conductorId, vehiculo_id: vehiculoId, es_principal: false },
    { transaction }
  );
  return findById(vehiculoId);
};

/**
 * Desvincula a un conductor como propietario de un vehículo (no permite quitar al
 * principal -- eso lo valida el service antes de llamar aquí).
 * @param {number} vehiculoId
 * @param {number} conductorId
 * @param {import('sequelize').Transaction} [opciones.transaction]
 * @returns {Promise<Object>} El vehículo con la lista de propietarios actualizada.
 */
const quitarPropietario = async (vehiculoId, conductorId, { transaction } = {}) => {
  await DetallePropiedad.destroy({ where: { vehiculo_id: vehiculoId, conductor_id: conductorId }, transaction });
  return findById(vehiculoId);
};

module.exports = {
  findAll, findById, findByPlaca, findByConductor, create, update, remove,
  findPropietario, agregarPropietario, quitarPropietario,
};
