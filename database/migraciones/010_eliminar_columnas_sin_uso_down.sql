-- =====================================================================
-- 010 DOWN - Restaura las columnas eliminadas por 010_eliminar_columnas_sin_uso.sql
-- =====================================================================
-- Recrea cada columna con el tipo y default del esquema original y, si las
-- tablas public.respaldo_010_* siguen existiendo, restaura los valores.
-- Las columnas de fecha NOT NULL vuelven con DEFAULT CURRENT_TIMESTAMP, así que
-- las filas existentes reciben la fecha del rollback, no la original.
-- =====================================================================

BEGIN;

-- Los UPDATE de restauración sobre parqueadero, celda y vehiculo disparan los triggers
-- de historial/auditoría, que exigen saber quién escribe (ver src/utils/dbContext.util.js).
-- Se firma como el primer administrador y con un motivo explícito.
DO $$ BEGIN
  PERFORM set_config('app.usuario_id', (SELECT min(id)::text FROM public.usuario WHERE rol_id = 1), true);
  PERFORM set_config('app.motivo', 'Rollback migración 010', true);
END $$;

-- 1. parqueadero
ALTER TABLE public.parqueadero
  ADD COLUMN IF NOT EXISTS plano_url character varying(500),
  ADD COLUMN IF NOT EXISTS observaciones character varying(500);

DO $$ BEGIN
  IF to_regclass('public.respaldo_010_parqueadero') IS NOT NULL THEN
    EXECUTE 'UPDATE public.parqueadero p SET plano_url = r.plano_url, observaciones = r.observaciones
  FROM public.respaldo_010_parqueadero r WHERE r.id = p.id;';
  END IF;
END $$;

-- 2. celda
ALTER TABLE public.celda
  ADD COLUMN IF NOT EXISTS posicion_x numeric(10,2),
  ADD COLUMN IF NOT EXISTS posicion_y numeric(10,2),
  ADD COLUMN IF NOT EXISTS ancho numeric(10,2),
  ADD COLUMN IF NOT EXISTS alto numeric(10,2);

DO $$ BEGIN
  IF to_regclass('public.respaldo_010_celda') IS NOT NULL THEN
    EXECUTE 'UPDATE public.celda c SET posicion_x = r.posicion_x, posicion_y = r.posicion_y, ancho = r.ancho, alto = r.alto
  FROM public.respaldo_010_celda r WHERE r.id = c.id;';
  END IF;
END $$;

ALTER TABLE public.celda DROP CONSTRAINT IF EXISTS ck_celda_posiciones;
ALTER TABLE public.celda ADD CONSTRAINT ck_celda_posiciones CHECK (
  (posicion_x IS NULL OR posicion_x >= 0) AND (posicion_y IS NULL OR posicion_y >= 0)
  AND (ancho IS NULL OR ancho > 0) AND (alto IS NULL OR alto > 0));

-- 3. conductor / detalle_propiedad
ALTER TABLE public.conductor
  ADD COLUMN IF NOT EXISTS fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE public.detalle_propiedad
  ADD COLUMN IF NOT EXISTS fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- 4. vehiculo
ALTER TABLE public.vehiculo
  ADD COLUMN IF NOT EXISTS tarjeta_propiedad character varying(20),
  ADD COLUMN IF NOT EXISTS cilindraje integer,
  ADD COLUMN IF NOT EXISTS servicio character varying(50),
  ADD COLUMN IF NOT EXISTS carroceria character varying(100),
  ADD COLUMN IF NOT EXISTS combustible character varying(50),
  ADD COLUMN IF NOT EXISTS capacidad integer,
  ADD COLUMN IF NOT EXISTS numero_motor character varying(100),
  ADD COLUMN IF NOT EXISTS numero_chasis character varying(100);

DO $$ BEGIN
  IF to_regclass('public.respaldo_010_vehiculo') IS NOT NULL THEN
    EXECUTE 'UPDATE public.vehiculo v SET
    tarjeta_propiedad = r.tarjeta_propiedad, cilindraje = r.cilindraje, servicio = r.servicio,
    carroceria = r.carroceria, combustible = r.combustible, capacidad = r.capacidad,
    numero_motor = r.numero_motor, numero_chasis = r.numero_chasis
  FROM public.respaldo_010_vehiculo r WHERE r.id = v.id;';
  END IF;
END $$;

-- 5. Catálogos
ALTER TABLE public.rol
  ADD COLUMN IF NOT EXISTS fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE public.rol_permiso
  ADD COLUMN IF NOT EXISTS fecha_asignacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;

ALTER TABLE public.modulo
  ADD COLUMN IF NOT EXISTS descripcion character varying(255),
  ADD COLUMN IF NOT EXISTS estado boolean DEFAULT true NOT NULL;
DO $$ BEGIN
  IF to_regclass('public.respaldo_010_modulo') IS NOT NULL THEN
    EXECUTE 'UPDATE public.modulo m SET descripcion = r.descripcion, estado = r.estado
  FROM public.respaldo_010_modulo r WHERE r.id = m.id;';
  END IF;
END $$;

ALTER TABLE public.tipo_usuario
  ADD COLUMN IF NOT EXISTS descripcion character varying(255),
  ADD COLUMN IF NOT EXISTS estado boolean DEFAULT true NOT NULL;
DO $$ BEGIN
  IF to_regclass('public.respaldo_010_tipo_usuario') IS NOT NULL THEN
    EXECUTE 'UPDATE public.tipo_usuario t SET descripcion = r.descripcion, estado = r.estado
  FROM public.respaldo_010_tipo_usuario r WHERE r.id = t.id;';
  END IF;
END $$;

-- 6. evidencia_novedad
ALTER TABLE public.evidencia_novedad
  ADD COLUMN IF NOT EXISTS fecha_hora timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;

COMMIT;
