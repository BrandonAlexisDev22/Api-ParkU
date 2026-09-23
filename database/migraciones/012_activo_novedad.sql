-- =====================================================================
-- 012 — El switch de activar/desactivar de incidentes y novedades
-- =====================================================================
--
-- El frontend ya tenía un switch para activar/desactivar un incidente o
-- novedad (independiente del ciclo de vida de `estado`: sirve para
-- archivarlo de la vista sin cancelarlo ni cerrarlo), pero la tabla
-- `novedad` nunca tuvo la columna que ese switch necesita. El PUT
-- respondía 200 sin guardar nada, así que el incidente volvía a verse
-- activo al recargar.
--
-- Aditivo y reversible: ninguna fila existente cambia de forma, todas
-- quedan ACTIVAS (`true`), que es el estado que ya asumían tanto el
-- frontend como el negocio.
-- =====================================================================

BEGIN;

ALTER TABLE novedad
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN novedad.activo IS
    'Visibilidad del incidente/novedad para el switch de activar/desactivar (Admin/Vigilante). No afecta el ciclo de vida de `estado`.';

COMMIT;
