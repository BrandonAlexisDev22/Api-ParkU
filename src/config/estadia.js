/**
 * @module EstadiaConfig
 * @description Umbral de estadía continua que amerita revisión -- concepto DISTINTO de
 * fuera_de_horario/minutos_excedidos (que se calculan contra la hora de cierre fija
 * 05:00-21:00, ver horarioOperacion.js). Este es un conteo simple desde el ingreso, sin
 * importar la hora del día; un ingreso marcado Oficial SENA queda exento. Compartido por
 * monitoreo.service.js (estadía en vivo) y novedades.service.js (estadía congelada al
 * momento del reporte).
 */

const LIMITE_ESTADIA_MINUTOS = 16 * 60;

module.exports = { LIMITE_ESTADIA_MINUTOS };
