const router = require('express').Router();
const ctrl = require('../controllers/monitoreo.controller');
const { verificarToken, verificarAcceso } = require('../middlewares/auth.middleware');

// Monitoreo es información operativa del parqueadero (quién ocupa cada celda, tiempos,
// incidentes) -- mismo criterio de acceso que /api/ocupaciones y /api/entradas-salidas:
// Admin (1) o Vigilante (2), nunca Conductor.

router.get('/celdas',
  verificarToken,
  verificarAcceso({ permisos: ['reportes.consultar'], roles: [1,2] }),
  ctrl.getCeldas
);

router.get('/fuera-horario',
  verificarToken,
  verificarAcceso({ permisos: ['reportes.consultar'], roles: [1,2] }),
  ctrl.getFueraDeHorario
);

router.post('/incidentes/fuera-horario',
  verificarToken,
  verificarAcceso({ permisos: ['novedades.gestionar'], roles: [1,2] }),
  ctrl.detectarIncidentesFueraDeHorario
);

module.exports = router;
