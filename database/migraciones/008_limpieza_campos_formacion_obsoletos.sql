BEGIN;

CREATE TABLE IF NOT EXISTS public.conductor_formacion_historica (
  id SERIAL PRIMARY KEY,
  conductor_id INTEGER NOT NULL REFERENCES public.conductor(id) ON DELETE CASCADE,
  regional_formacion VARCHAR(255),
  centro_formacion VARCHAR(255),
  programa_formacion VARCHAR(255),
  fecha_copia TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  motivo TEXT NOT NULL DEFAULT 'Limpieza de campos formativos obsoletos sin uso en la app'
);

INSERT INTO public.conductor_formacion_historica (conductor_id, regional_formacion, centro_formacion, programa_formacion)
SELECT id, regional_formacion, centro_formacion, programa_formacion
FROM public.conductor
WHERE regional_formacion IS NOT NULL
   OR centro_formacion IS NOT NULL
   OR programa_formacion IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conductor'
      AND column_name = 'regional_formacion'
  ) THEN
    ALTER TABLE public.conductor DROP COLUMN regional_formacion;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conductor'
      AND column_name = 'centro_formacion'
  ) THEN
    ALTER TABLE public.conductor DROP COLUMN centro_formacion;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conductor'
      AND column_name = 'programa_formacion'
  ) THEN
    ALTER TABLE public.conductor DROP COLUMN programa_formacion;
  END IF;
END $$;

COMMIT;
