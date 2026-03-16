const r = require('express').Router();
const c = require('../controllers/rol.controller');
r.get('/', c.getAll);  r.get('/:id', c.getById);
r.post('/', c.create); r.put('/:id', c.update); r.delete('/:id', c.remove);
module.exports = r;
