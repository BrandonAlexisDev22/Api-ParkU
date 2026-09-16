/**
 * ====================================================
 * ALCANCE DE LECTURA: ¿qué puede ver quien pide?
 * ====================================================
 *
 * La autorización por ruta (verificarAcceso) decide si un rol puede ENTRAR a un módulo,
 * pero no sobre QUÉ registros. El rol Conductor tiene, por ejemplo, `reservas.consultar`
 * y `novedades.consultar`: sin este archivo, eso le daba la lista completa de reservas
 * y novedades de todo el mundo, y con un id cualquiera podía leer la reserva, el vehículo
 * o la ficha (documento, dirección, teléfono) de cualquier otra persona.
 *
 * La regla, igual en todos los módulos:
 *
 * - **Gestor**: Administrador, Vigilante o cualquier rol con el permiso de GESTIÓN del
 *   módulo (`reservas.gestionar`, `novedades.gestionar`, ...). Ve todo, como hasta ahora:
 *   atiende a terceros en portería y para eso necesita sus datos.
 * - **Cualquier otro** (Conductor y roles a medida que solo tienen `consultar`): ve lo
 *   SUYO. "Suyo" es lo que está a nombre de su conductor, de sus vehículos, lo que
 *   registró o reportó él mismo, o su propia cuenta.
 *
 * Los servicios reciben al `solicitante` (`req.usuario`: { id, rol }) y llaman a
 * `resolverAlcance`. Si no hay solicitante (llamadas internas entre servicios, scripts) no
 * se acota nada: el filtro es para lo que entra por HTTP.
 *
 * @module AlcanceUtil
 */

const { ROLES } = require('../config/roles');
const { permisosDelRol } = require('../middlewares/auth.middleware');
const conductorRepo = require('../repositories/conductor.repository');
const vehiculoRepo = require('../repositories/vehiculo.repository');

// Genérico a propósito: no dice si el recurso existe ni de quién es.
const SIN_ACCESO = Object.freeze({ status: 403, message: 'No tienes acceso a este recurso' });

const num = (v) => (v === null || v === undefined ? null : Number(v));

/**
 * @typedef {Object} Alcance
 * @property {boolean} gestor - true: ve todo; no se aplica ningún filtro.
 * @property {number|null} usuarioId
 * @property {number|null} conductorId - Conductor vinculado a la cuenta (o null).
 * @property {Set<number>} vehiculoIds - Vehículos de ese conductor.
 * @property {(vehiculoId:any)=>boolean} esVehiculoPropio
 * @property {(conductorId:any)=>boolean} esConductorPropio
 * @property {(usuarioId:any)=>boolean} esUsuarioPropio
 */

/**
 * Determina si quien pide es gestor del módulo o, si no, qué le pertenece.
 * @param {{id:number, rol:number}|undefined} solicitante - req.usuario.
 * @param {string[]} [permisosDeGestion] - Permisos que convierten a un rol en gestor del módulo.
 * @returns {Promise<Alcance>}
 */
const resolverAlcance = async (solicitante, permisosDeGestion = []) => {
  const todo = { gestor: true, usuarioId: null, conductorId: null, vehiculoIds: new Set(),
    esVehiculoPropio: () => true, esConductorPropio: () => true, esUsuarioPropio: () => true };

  if (!solicitante || solicitante.id === undefined) return todo;

  const rol = num(solicitante.rol);
  if (rol === ROLES.ADMIN || rol === ROLES.VIGILANTE) return todo;
  if (permisosDeGestion.length) {
    const permisos = await permisosDelRol(rol);
    if (permisosDeGestion.some((p) => permisos.has(p))) return todo;
  }

  const usuarioId = num(solicitante.id);
  const conductor = await conductorRepo.findByUsuarioId(usuarioId);
  const conductorId = conductor ? num(conductor.id) : null;
  const vehiculos = conductorId ? await vehiculoRepo.findByConductor(conductorId) : [];
  const vehiculoIds = new Set(vehiculos.map((v) => num(v.id)));

  return {
    gestor: false,
    usuarioId,
    conductorId,
    vehiculoIds,
    esVehiculoPropio: (id) => id !== null && id !== undefined && vehiculoIds.has(num(id)),
    esConductorPropio: (id) => conductorId !== null && num(id) === conductorId,
    esUsuarioPropio: (id) => num(id) === usuarioId,
  };
};

/**
 * Lanza 403 si la condición no se cumple para quien no es gestor.
 * @param {Alcance} alcance
 * @param {boolean} condicion
 */
const exigir = (alcance, condicion) => {
  if (!alcance.gestor && !condicion) throw SIN_ACCESO;
};

/**
 * Filtra una lista dejando solo lo que el solicitante puede ver (todo, si es gestor).
 * @template T
 * @param {Alcance} alcance
 * @param {T[]} filas
 * @param {(fila:T)=>boolean} esPropia
 * @returns {T[]}
 */
const acotar = (alcance, filas, esPropia) => (alcance.gestor ? filas : filas.filter(esPropia));

module.exports = { resolverAlcance, exigir, acotar, SIN_ACCESO };
