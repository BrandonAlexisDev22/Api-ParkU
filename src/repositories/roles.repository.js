let roles = [];
let idCounter = 1;

const getAll = () => roles;

const getById = (id) => roles.find(r => r.id_rol === id);

const getByName = (name) => roles.find(r => r.nombre_rol === name);

const create = (roleData) => {
  const newRole = { id_rol: idCounter++, ...roleData };
  roles.push(newRole);
  return newRole;
};

module.exports = {
  getAll,
  getById,
  getByName,
  create
};