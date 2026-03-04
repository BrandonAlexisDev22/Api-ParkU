const roleRepository = require('../repositories/roles.repository');

const createRole = (data) => {
  const existing = roleRepository.getByName(data.nombre_rol);
  if (existing) {
    throw new Error('El rol ya existe');
  }

  return roleRepository.create(data);
};

const getRoles = () => roleRepository.getAll();

module.exports = {
  createRole,
  getRoles
};