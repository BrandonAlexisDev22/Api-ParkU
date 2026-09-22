/**
 * @module VehiculoVinculadoUtil
 * @description Alta del vehículo de quien se acaba de registrar, en la MISMA transacción que
 * su Usuario y su Conductor (ver conductorVinculado.util.js) -- si el vehículo no es válido
 * (placa duplicada, formato o tipo inválido, marca/color vacíos), el rollback se lleva
 * también la cuenta y el conductor: el registro público exige tener un vehículo propio, así
 * que no puede quedar una cuenta creada sin él.
 *
 * Reutiliza la MISMA validación de placa/tipo que `vehiculo.service.js::create` usa cuando un
 * conductor YA AUTENTICADO da de alta un vehículo propio (ver `_validarPlaca`/`TIPOS_PERMITIDOS`,
 * reexportados desde ahí), para que el registro público rechace exactamente los mismos casos.
 */

const vehiculoRepo = require('../repositories/vehiculo.repository');
const { validarTipoSegunPlaca } = require('./compatibilidadVehiculo.util');
const { _validarPlaca: validarPlaca, TIPOS_PERMITIDOS } = require('../services/vehiculo.service');

/**
 * Crea el vehículo de quien acaba de registrarse, con su Conductor recién creado como
 * propietario principal.
 *
 * @param {Object} datos
 * @param {number} datos.conductor_id - El conductor recién creado en la misma transacción.
 * @param {string} datos.tipo - 'CARRO' o 'MOTO'.
 * @param {string} datos.placa
 * @param {string} datos.marca
 * @param {string} [datos.linea]
 * @param {number} [datos.modelo] - Año del vehículo.
 * @param {string} datos.color
 * @param {string} [datos.descripcion]
 * @param {import('sequelize').Transaction} datos.transaction
 * @throws {Object} 400 si falta o es inválido algún dato; 409 si la placa ya está registrada.
 * @returns {Promise<Object>} El vehículo creado.
 */
const crearVehiculoVinculado = async ({
  conductor_id, tipo, placa, marca, linea, modelo, color, descripcion, transaction,
}) => {
  if (!tipo) throw { status: 400, message: 'El tipo de vehículo es requerido' };
  const tipoNormalizado = tipo.toString().trim().toUpperCase();
  if (!TIPOS_PERMITIDOS.includes(tipoNormalizado)) {
    throw { status: 400, message: `Tipo de vehículo inválido. Permitidos: ${TIPOS_PERMITIDOS.join(', ')}` };
  }

  if (!placa) throw { status: 400, message: 'La placa del vehículo es requerida' };
  if (!marca || !String(marca).trim()) throw { status: 400, message: 'La marca del vehículo es requerida' };
  if (!color || !String(color).trim()) throw { status: 400, message: 'El color del vehículo es requerido' };

  const placaNormalizada = validarPlaca(placa);
  // Mismo criterio que el alta autenticada: último carácter numérico -> carro, alfabético -> moto.
  validarTipoSegunPlaca(tipoNormalizado, placaNormalizada);

  const placaExiste = await vehiculoRepo.findByPlaca(placaNormalizada);
  if (placaExiste) {
    throw {
      status: 409,
      message: 'Ese vehículo ya está registrado a nombre de otra persona',
      data: {
        vehiculo_id: placaExiste.id,
        placa: placaExiste.placa,
        tipo: placaExiste.tipo,
        conductor_principal_id: placaExiste.conductor_principal_id,
        conductor_principal_nombre: placaExiste.conductor_principal_nombre,
      },
    };
  }

  return vehiculoRepo.create(
    {
      conductor_id,
      tipo: tipoNormalizado,
      placa: placaNormalizada,
      marca: marca.trim(),
      linea: linea ? linea.trim() : null,
      modelo: modelo || null,
      color: color.trim(),
      observaciones: descripcion ? descripcion.trim() : null,
      estado: true,
    },
    { transaction },
  );
};

module.exports = { crearVehiculoVinculado };
