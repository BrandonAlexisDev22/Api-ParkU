/**
 * @module CompatibilidadVehiculoUtil
 * @description Única fuente de verdad del backend para dos reglas que antes no existían
 * o vivían implícitas en la base de datos:
 *
 *   1. Qué tipo de vehículo implica una placa (último carácter: dígito → 4 ruedas,
 *      letra → moto).
 *   2. Si un vehículo puede ocupar/reservar una celda (el tipo debe coincidir).
 *
 * La regla de compatibilidad la aplica ya el trigger fn_validar_ocupacion_celda (punto
 * 3.4) al crear la ocupación de un ingreso, pero SOLO ahí: reservas, sugerencias y alta de
 * vehículo desde el panel de estacionamiento no pasaban por ese camino. Este módulo
 * replica exactamente el mismo criterio (igualdad estricta de tipo) para que las cuatro
 * rutas respondan igual, en vez de tener tres reglas distintas -- y para poder rechazar
 * con un 409 legible antes de llegar al RAISE EXCEPTION de Postgres.
 */

// Tipos que circulan sobre placa "de carro" (último carácter numérico). El enum real de
// vehiculo/celda es CARRO, MOTO, BICICLETA, CAMION, BUS.
const TIPOS_PLACA_NUMERICA = ['CARRO', 'CAMION', 'BUS'];

/**
 * Deduce el tipo de vehículo a partir del último carácter de la placa, según la regla del
 * proyecto: dígito → carro, letra → moto.
 *
 * Devuelve la familia, no el tipo exacto: una placa terminada en dígito puede ser CARRO,
 * CAMION o BUS, y esta función no puede distinguirlos. Por eso el valor 'CARRO' que
 * retorna significa "vehículo de placa numérica"; para validar contra un tipo declarado
 * usa `validarTipoSegunPlaca`, que sí contempla camión y bus.
 *
 * @param {string} placa
 * @returns {'CARRO'|'MOTO'|null} null si la placa está vacía o no termina en alfanumérico
 *   (p. ej. bicicletas, que no llevan placa).
 */
const tipoPorPlaca = (placa) => {
  const normalizada = (placa || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!normalizada) return null;

  const ultimo = normalizada[normalizada.length - 1];
  if (/[0-9]/.test(ultimo)) return 'CARRO';
  if (/[A-Z]/.test(ultimo)) return 'MOTO';
  return null;
};

/**
 * Comprueba que el tipo declarado de un vehículo sea coherente con su placa.
 *
 * No exige igualdad con `tipoPorPlaca` porque esa función no distingue CARRO de CAMION ni
 * de BUS: lo que se valida es la familia. Una placa terminada en letra tiene que ser MOTO;
 * una terminada en dígito tiene que ser CARRO, CAMION o BUS.
 *
 * @param {string} tipoDeclarado - Tipo del enum de vehiculo.
 * @param {string} placa
 * @throws {Object} 400 si el tipo declarado contradice la placa.
 */
const validarTipoSegunPlaca = (tipoDeclarado, placa) => {
  const implicado = tipoPorPlaca(placa);
  if (!implicado || !tipoDeclarado) return; // Sin placa (bicicleta) no hay nada que validar.

  if (implicado === 'MOTO' && tipoDeclarado !== 'MOTO') {
    throw {
      status: 400,
      message: `La placa ${placa} termina en letra, que corresponde a una MOTO; no puede registrarse como ${tipoDeclarado}`,
    };
  }
  if (implicado === 'CARRO' && !TIPOS_PLACA_NUMERICA.includes(tipoDeclarado)) {
    throw {
      status: 400,
      message: `La placa ${placa} termina en número, que corresponde a un vehículo de cuatro ruedas (${TIPOS_PLACA_NUMERICA.join(', ')}); no puede registrarse como ${tipoDeclarado}`,
    };
  }
};

/**
 * ¿Puede este tipo de vehículo ocupar este tipo de celda?
 * Igualdad estricta, el mismo criterio que fn_validar_ocupacion_celda punto 3.4.
 * @param {string} tipoVehiculo
 * @param {string} tipoCelda
 * @returns {boolean}
 */
const esCompatible = (tipoVehiculo, tipoCelda) => !!tipoVehiculo && !!tipoCelda && tipoVehiculo === tipoCelda;

/**
 * Rechaza la operación si el vehículo no corresponde al tipo de la celda. Se usa en
 * reservas, ingreso y alta de vehículo desde estacionamiento, para que las tres rechacen
 * exactamente lo mismo que rechazaría el trigger de la BD.
 * @param {Object} vehiculo - Debe traer al menos {tipo, placa?}.
 * @param {Object} celda - Debe traer al menos {tipo, numero?}.
 * @throws {Object} 409 si los tipos no coinciden.
 */
const validarCompatibilidadCelda = (vehiculo, celda) => {
  if (!vehiculo || !celda) return;
  if (esCompatible(vehiculo.tipo, celda.tipo)) return;

  const identificacionVehiculo = vehiculo.placa ? ` (${vehiculo.placa})` : '';
  const identificacionCelda = celda.numero ? ` ${celda.numero}` : '';
  throw {
    status: 409,
    message: `El vehículo es de tipo ${vehiculo.tipo}${identificacionVehiculo} y la celda${identificacionCelda} es de tipo ${celda.tipo}: no son compatibles`,
  };
};

module.exports = {
  tipoPorPlaca,
  validarTipoSegunPlaca,
  esCompatible,
  validarCompatibilidadCelda,
  TIPOS_PLACA_NUMERICA,
};
