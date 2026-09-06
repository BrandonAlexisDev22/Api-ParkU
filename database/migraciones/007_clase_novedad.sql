-- =====================================================================
-- 007 — Incidente y novedad son dos cosas distintas
-- =====================================================================
--
-- La tabla `novedad` guardaba todo en el mismo saco: un choque y una
-- observación de turno se registraban igual, con los mismos campos
-- obligatorios. Pero no son lo mismo:
--
--   INCIDENTE  Un daño, un choque, una problemática. Ocurre SOBRE algo
--              concreto (una celda, un vehículo) y necesita tipo y
--              prioridad para poder atenderlo y ordenarlo.
--
--   NOVEDAD    Una observación de la operación, sin gravedad. No tiene
--              celda ni vehículo detrás, y exigirle tipo y prioridad
--              solo obligaba a inventar datos. Solo la registra el
--              personal del parqueadero (Administrador o Vigilante).
--
-- Tres cambios, todos aditivos y reversibles (ninguna fila cambia de
-- forma ni se pierde ningún dato):
--
--   clase        Distingue las dos. Las filas que ya existen quedan como
--                INCIDENTE, que es lo que eran.
--
--   tipo_otro    Cuando el tipo es OTRO, en qué consiste. Antes esa
--                precisión se perdía o se colaba en la descripción.
--
--   tipo_novedad Deja de ser obligatorio: una NOVEDAD no tiene tipo.
--                Para un INCIDENTE lo sigue exigiendo la aplicación.
-- =====================================================================

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clase_novedad_enum') THEN
        CREATE TYPE clase_novedad_enum AS ENUM ('INCIDENTE', 'NOVEDAD');
    END IF;
END
$$;

ALTER TABLE novedad
    ADD COLUMN IF NOT EXISTS clase clase_novedad_enum NOT NULL DEFAULT 'INCIDENTE';

ALTER TABLE novedad
    ADD COLUMN IF NOT EXISTS tipo_otro VARCHAR(100);

-- Una novedad no lleva tipo: la obligatoriedad pasa a ser de la aplicación,
-- que la exige solo para los incidentes (ver novedades.service.js).
ALTER TABLE novedad
    ALTER COLUMN tipo_novedad DROP NOT NULL;

COMMENT ON COLUMN novedad.clase IS
    'INCIDENTE (daño/choque/problemática, exige tipo y prioridad) o NOVEDAD (observación de la operación, solo personal autorizado).';
COMMENT ON COLUMN novedad.tipo_otro IS
    'Detalle del tipo cuando tipo_novedad = OTRO.';

COMMIT;
