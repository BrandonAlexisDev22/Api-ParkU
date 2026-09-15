-- =====================================================================
-- 010 - Eliminar columnas sin uso en tablas que sí se usan
-- =====================================================================
-- Verificado contra src/ y contra la BD real (introspección 2026-09-15).
-- Cada columna de abajo aparecía como máximo en el modelo Sequelize, en la
-- lista `allowedFields` de un repositorio o en el seed; ninguna la lee una
-- regla de negocio, un trigger ni una función de la BD.
--
-- Las vistas v_conductor_front, v_control_placas y v_vehiculo_front (únicas que
-- referenciaban alguna de estas columnas, por el `co2.*` / `ve.*` expandido de
-- pg_dump) ya se recrean sin ellas en la migración 008, que corre antes.
-- Los DROP COLUMN van sin CASCADE a propósito: si quedara alguna dependencia
-- inesperada, la migración falla en vez de borrarla en silencio.
--
-- Quedan FUERA a propósito (uso real en el backend, ver docs/limpieza-bd-010.md):
--   novedad.registro_acceso_id, novedad.fecha_hora_cierre,
--   registro_acceso.descripcion_ingreso / descripcion_salida,
--   vehiculo.vehiculo_sena, vehiculo.fecha_creacion (alimenta trg_vehiculo_auditoria).
--
-- Rollback: 010_eliminar_columnas_sin_uso_down.sql (recrea columnas con sus
-- defaults; los valores anteriores se pierden salvo los de respaldo_010_*).
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------
-- 0. Respaldo de los valores que se van a perder (solo filas con dato)
-- ---------------------------------------------------------------
-- (Cada respaldo solo se crea si la columna aún existe: así la migración se puede
--  re-ejecutar sin error cuando ya fue aplicada.)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parqueadero' AND column_name = 'plano_url') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS public.respaldo_010_parqueadero AS
  SELECT id, plano_url, observaciones FROM public.parqueadero
   WHERE plano_url IS NOT NULL OR observaciones IS NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'celda' AND column_name = 'posicion_x') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS public.respaldo_010_celda AS
  SELECT id, posicion_x, posicion_y, ancho, alto FROM public.celda
   WHERE posicion_x IS NOT NULL OR posicion_y IS NOT NULL OR ancho IS NOT NULL OR alto IS NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehiculo' AND column_name = 'servicio') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS public.respaldo_010_vehiculo AS
  SELECT id, tarjeta_propiedad, cilindraje, servicio, carroceria, combustible,
         capacidad, numero_motor, numero_chasis
    FROM public.vehiculo
   WHERE tarjeta_propiedad IS NOT NULL OR cilindraje IS NOT NULL OR servicio IS NOT NULL
      OR carroceria IS NOT NULL OR combustible IS NOT NULL OR capacidad IS NOT NULL
      OR numero_motor IS NOT NULL OR numero_chasis IS NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'modulo' AND column_name = 'estado') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS public.respaldo_010_modulo AS
  SELECT id, descripcion, estado FROM public.modulo';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tipo_usuario' AND column_name = 'estado') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS public.respaldo_010_tipo_usuario AS
  SELECT id, descripcion, estado FROM public.tipo_usuario';
  END IF;
END $$;

-- ---------------------------------------------------------------
-- 1. parqueadero
-- ---------------------------------------------------------------
ALTER TABLE public.parqueadero
  DROP COLUMN IF EXISTS plano_url,
  DROP COLUMN IF EXISTS observaciones;

-- ---------------------------------------------------------------
-- 2. celda (coordenadas del plano; el CHECK depende de ellas)
-- ---------------------------------------------------------------
ALTER TABLE public.celda
  DROP CONSTRAINT IF EXISTS ck_celda_posiciones,
  DROP COLUMN IF EXISTS posicion_x,
  DROP COLUMN IF EXISTS posicion_y,
  DROP COLUMN IF EXISTS ancho,
  DROP COLUMN IF EXISTS alto;

-- ---------------------------------------------------------------
-- 3. conductor / detalle_propiedad
-- ---------------------------------------------------------------
ALTER TABLE public.conductor DROP COLUMN IF EXISTS fecha_creacion;
ALTER TABLE public.detalle_propiedad DROP COLUMN IF EXISTS fecha_registro;

-- ---------------------------------------------------------------
-- 4. vehiculo (ficha técnica que ningún flujo lee)
-- ---------------------------------------------------------------
ALTER TABLE public.vehiculo
  DROP COLUMN IF EXISTS tarjeta_propiedad,
  DROP COLUMN IF EXISTS cilindraje,
  DROP COLUMN IF EXISTS servicio,
  DROP COLUMN IF EXISTS carroceria,
  DROP COLUMN IF EXISTS combustible,
  DROP COLUMN IF EXISTS capacidad,
  DROP COLUMN IF EXISTS numero_motor,
  DROP COLUMN IF EXISTS numero_chasis;

-- ---------------------------------------------------------------
-- 5. Catálogos: rol, rol_permiso, modulo, tipo_usuario
-- ---------------------------------------------------------------
ALTER TABLE public.rol DROP COLUMN IF EXISTS fecha_creacion;
ALTER TABLE public.rol_permiso DROP COLUMN IF EXISTS fecha_asignacion;

ALTER TABLE public.modulo
  DROP COLUMN IF EXISTS descripcion,
  DROP COLUMN IF EXISTS estado;

ALTER TABLE public.tipo_usuario
  DROP COLUMN IF EXISTS descripcion,
  DROP COLUMN IF EXISTS estado;

-- ---------------------------------------------------------------
-- 6. evidencia_novedad (el listado pasa a ordenarse por id)
-- ---------------------------------------------------------------
ALTER TABLE public.evidencia_novedad DROP COLUMN IF EXISTS fecha_hora;

COMMIT;
