// src/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express(); 

// ─── Middlewares globales ───────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Definición de rutas ────────────────────────────────────────────

app.use('/api/roles', require('./routes/roles.routes'));
app.use('/api/permisos', require('./routes/permisos.routes'));
app.use('/api/usuarios', require('./routes/usuarios.routes'))

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});