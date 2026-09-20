-- =====================================================================
-- Reversión de 007
-- =====================================================================
-- Quita `clase` y `tipo_otro`, y vuelve a exigir `tipo_novedad`.
--
-- Restaurar el NOT NULL de tipo_novedad solo es seguro si no existen filas
-- NOVEDAD con tipo_novedad NULL (que es justo lo que 007 permitió crear). Si
-- ya se registraron NOVEDAD sin tipo, la restauración del NOT NULL se omite
-- y se avisa por consola en vez de fallar la transacción entera.
-- =====================================================================

BEGIN;

ALTER TABLE novedad DROP COLUMN IF EXISTS tipo_otro;
ALTER TABLE novedad DROP COLUMN IF EXISTS clase;

DROP TYPE IF EXISTS clase_novedad_enum;

DO $$
DECLARE
  v_nulos BIGINT;
BEGIN
  SELECT count(*) INTO v_nulos FROM novedad WHERE tipo_novedad IS NULL;
  IF v_nulos = 0 THEN
    ALTER TABLE novedad ALTER COLUMN tipo_novedad SET NOT NULL;
  ELSE
    RAISE NOTICE 'No se restaura NOT NULL en novedad.tipo_novedad: existen % fila(s) sin tipo (creadas como NOVEDAD tras 007).', v_nulos;
  END IF;
END $$;

COMMIT;
