const roleService = require('../services/role.services');

const createRole = (req, res) => {
  try {
    const role = roleService.createRole(req.body);
    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getRoles = (req, res) => {
  const roles = roleService.getRoles();
  res.json(roles);
};

module.exports = {
  createRole,
  getRoles
};