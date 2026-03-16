const repo       = require('../repositories/entradaSalida.repository');
const celdaRepo  = require('../repositories/celda.repository');
const vehRepo    = require('../repositories/vehiculo.repository');

const getAll = () => repo.findAll();

const getById = async (id) => {
  const item = await repo.findById(id);
  if (!item) throw { status: 404, message: 'Registro no encontrado' };
  return item;
};

const getByVehiculo = (vehiculoId) => repo.findByVehiculo(vehiculoId);

const getByFecha = (desde, hasta) => {
  if (!desde || !hasta) throw { status: 400, message: 'desde y hasta son requeridos' };
  return repo.findByFecha(desde, hasta);
};

const registrarEntrada = async ({ celda, vehiculo, descripcion }) => {
  if (!celda || !vehiculo) throw { status: 400, message: 'celda y vehiculo son requeridos' };

  const celdaExiste = await celdaRepo.findById(celda);
  if (!celdaExiste) throw { status: 404, message: 'Celda no encontrada' };
  if (!celdaExiste.estado) throw { status: 409, message: 'La celda no está disponible' };

  const vehExiste = await vehRepo.findById(vehiculo);
  if (!vehExiste) throw { status: 404, message: 'Vehículo no encontrado' };

  // Marcar celda como ocupada (estado = 0)
  await celdaRepo.update(celda, { discapacidad: celdaExiste.discapacidad, estado: 0 });

  return repo.create({ tipo: 'entrada', celda, vehiculo, descripcion });
};

const registrarSalida = async ({ celda, vehiculo, descripcion }) => {
  if (!celda || !vehiculo) throw { status: 400, message: 'celda y vehiculo son requeridos' };

  const celdaExiste = await celdaRepo.findById(celda);
  if (!celdaExiste) throw { status: 404, message: 'Celda no encontrada' };

  // Liberar celda (estado = 1)
  await celdaRepo.update(celda, { discapacidad: celdaExiste.discapacidad, estado: 1 });

  return repo.create({ tipo: 'salida', celda, vehiculo, descripcion });
};

const remove = async (id) => {
  await getById(id);
  return repo.remove(id);
};

module.exports = { getAll, getById, getByVehiculo, getByFecha, registrarEntrada, registrarSalida, remove };
