-- =====================================================================
-- ParkU - Limpieza de esquema: migraciones 008 + 009 + 010 en UNA transacción
-- =====================================================================
-- Ejecutar en Neon (SQL Editor o psql). Si cualquier sentencia falla, se
-- revierte todo y la base queda como estaba.
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migraciones/neon_limpieza_008_009_010.sql
--
-- Antes de correrlo: haz un branch/backup en Neon (Branches > Create branch).
-- Rollback: 010_eliminar_columnas_sin_uso_down.sql y luego 009_..._down.sql
-- (008 no tiene down; sus datos quedan en conductor_formacion_historica).
-- Idempotente: si ya se aplicó, vuelve a correr sin error y sin cambios.
-- =====================================================================

BEGIN;

-- #####################################################################
-- 008_limpieza_campos_formacion_obsoletos
-- #####################################################################
-- Las vistas v_conductor_front, v_control_placas y v_vehiculo_front dependen de las
-- columnas de formacion (pg_dump expandio `SELECT co2.*` en sus subconsultas LATERAL),
-- asi que Postgres rechazaria el DROP COLUMN. Se eliminan aqui y se recrean al final
-- seleccionando solo las columnas que cada vista realmente expone.
DROP VIEW IF EXISTS public.v_conductor_front;
DROP VIEW IF EXISTS public.v_control_placas;
DROP VIEW IF EXISTS public.v_vehiculo_front;

CREATE TABLE IF NOT EXISTS public.conductor_formacion_historica (
  id SERIAL PRIMARY KEY,
  conductor_id INTEGER NOT NULL REFERENCES public.conductor(id) ON DELETE CASCADE,
  regional_formacion VARCHAR(255),
  centro_formacion VARCHAR(255),
  programa_formacion VARCHAR(255),
  fecha_copia TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  motivo TEXT NOT NULL DEFAULT 'Limpieza de campos formativos obsoletos sin uso en la app'
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'conductor' AND column_name = 'regional_formacion') THEN
    INSERT INTO public.conductor_formacion_historica (conductor_id, regional_formacion, centro_formacion, programa_formacion)
    SELECT id, regional_formacion, centro_formacion, programa_formacion
      FROM public.conductor
     WHERE regional_formacion IS NOT NULL OR centro_formacion IS NOT NULL OR programa_formacion IS NOT NULL;
  END IF;
END $$;

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

-- ---------------------------------------------------------------
-- Vistas recreadas sin los campos de formacion. Las subconsultas LATERAL
-- ya no arrastran `co2.*` / `ve.*`: solo las columnas que se usan.
-- ---------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_conductor_front AS
 SELECT co.id,
    co.usuario_id,
    co.nombre_apellidos AS nombre,
    co.tipo_documento,
    co.numero_documento AS identificacion,
    COALESCE(u.correo, co.correo) AS email,
    co.numero_telefonico,
    co.direccion,
    tu.nombre AS tipo_conductor,
    co.movilidad_reducida AS discapacidad,
    co.tipo_discapacidad,
    co.vigencia,
    co.estado,
    v.id AS vehiculo_id,
    v.placa,
    v.tipo AS tipo_vehiculo
   FROM public.conductor co
     LEFT JOIN public.usuario u ON u.id = co.usuario_id
     LEFT JOIN public.tipo_usuario tu ON tu.id = co.tipo_usuario_id
     LEFT JOIN LATERAL (
        SELECT ve.id, ve.placa, ve.tipo
          FROM public.detalle_propiedad dp
          JOIN public.vehiculo ve ON ve.id = dp.vehiculo_id
         WHERE dp.conductor_id = co.id AND dp.estado = true
         ORDER BY dp.es_principal DESC, dp.id
         LIMIT 1) v ON true;

CREATE OR REPLACE VIEW public.v_control_placas AS
 SELECT v.id AS vehiculo_id,
    v.placa,
    v.marca,
    v.modelo,
    v.color,
    v.tipo,
    v.estado AS vehiculo_activo,
    CASE WHEN ra.id IS NOT NULL AND ra.fecha_hora_salida IS NULL THEN 'DENTRO' ELSE 'FUERA' END AS estado_ingreso_salida,
    ra.id AS registro_acceso_id,
    ra.fecha_hora_ingreso,
    ra.fecha_hora_salida,
    p.nombre AS parqueadero,
    p.zona,
    p.piso,
    c.numero AS celda,
    co.nombre_apellidos AS propietario_conductor
   FROM public.vehiculo v
     LEFT JOIN LATERAL (
        SELECT ra2.id, ra2.parqueadero_id, ra2.celda_id, ra2.fecha_hora_ingreso, ra2.fecha_hora_salida
          FROM public.registro_acceso ra2
         WHERE ra2.vehiculo_id = v.id
         ORDER BY ra2.fecha_hora_ingreso DESC
         LIMIT 1) ra ON true
     LEFT JOIN public.parqueadero p ON p.id = ra.parqueadero_id
     LEFT JOIN public.celda c ON c.id = ra.celda_id
     LEFT JOIN LATERAL (
        SELECT co2.id, co2.nombre_apellidos
          FROM public.detalle_propiedad dp
          JOIN public.conductor co2 ON co2.id = dp.conductor_id
         WHERE dp.vehiculo_id = v.id AND dp.estado = true
         ORDER BY dp.es_principal DESC, dp.id
         LIMIT 1) co ON true;

CREATE OR REPLACE VIEW public.v_vehiculo_front AS
 SELECT v.id,
    v.placa,
    v.tipo,
    v.marca,
    v.linea AS modelo,
    v.modelo AS anio,
    v.color,
    v.observaciones AS descripcion,
    v.vehiculo_sena,
    v.estado,
    co.id AS conductor_id,
    co.nombre_apellidos AS conductor,
    ra.parqueadero_id,
    ra.celda_id,
    c.numero AS celda,
    ra.fecha_hora_ingreso AS fecha_entrada,
    (ra.id IS NOT NULL) AS esta_dentro
   FROM public.vehiculo v
     LEFT JOIN LATERAL (
        SELECT co2.id, co2.nombre_apellidos
          FROM public.detalle_propiedad dp
          JOIN public.conductor co2 ON co2.id = dp.conductor_id
         WHERE dp.vehiculo_id = v.id AND dp.estado = true
         ORDER BY dp.es_principal DESC, dp.id
         LIMIT 1) co ON true
     LEFT JOIN LATERAL (
        SELECT ra2.id, ra2.parqueadero_id, ra2.celda_id, ra2.fecha_hora_ingreso
          FROM public.registro_acceso ra2
         WHERE ra2.vehiculo_id = v.id AND ra2.fecha_hora_salida IS NULL
         ORDER BY ra2.fecha_hora_ingreso DESC
         LIMIT 1) ra ON true
     LEFT JOIN public.celda c ON c.id = ra.celda_id;

-- #####################################################################
-- 009_eliminar_tablas_sin_uso
-- #####################################################################
-- =====================================================================
-- 009 - Eliminar tablas sin uso (ni backend, ni frontend, ni triggers)
-- =====================================================================
-- Verificado contra src/ (cero referencias) y contra la BD real (introspección
-- 2026-09-15). Ninguna de estas tablas tiene endpoint, modelo Sequelize, trigger
-- que escriba en ella ni FK entrante desde una tabla que se conserve.
--
--   autorizacion_acceso        (2 filas)  -> también fn_usuario_autorizado_acceso,
--                                            v_autorizaciones_activas
--   captura_placa              (2 filas)  -> también trg/fn_normalizar_placa,
--                                            v_reconocimiento_placas
--   intento_ocr                (2 filas)  -> FK a captura_placa
--   encuesta                   (1 fila)
--   valoracion                 (2 filas)  -> FK a encuesta; v_desempeno_satisfaccion
--   licencia_conduccion        (6 filas)
--   parqueadero_ip_autorizada  (3 filas)
--
-- NO se tocan aquí (tienen endpoints montados y/o triggers que escriben en ellas):
--   auditoria, notificacion, historial_celda, historial_parqueadero,
--   historial_reserva, historial_novedad, historial_disponibilidad_celda,
--   asignacion_vigilante, equipamiento_parqueadero.
--
-- Rollback: 009_eliminar_tablas_sin_uso_down.sql (recrea estructura, no datos).
-- Los datos actuales (18 filas en total) se conservan en public.respaldo_009_*
-- para poder restaurarlos manualmente si hiciera falta.
-- =====================================================================


-- ---------------------------------------------------------------
-- 0. Respaldo de datos (tablas planas, sin FKs; se pueden borrar
--    después de confirmar que la limpieza fue correcta)
-- ---------------------------------------------------------------
-- (Solo si la tabla original aún existe: permite re-ejecutar la migración sin error.)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['autorizacion_acceso', 'captura_placa', 'intento_ocr', 'encuesta',
                           'valoracion', 'licencia_conduccion', 'parqueadero_ip_autorizada'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('CREATE TABLE IF NOT EXISTS public.respaldo_009_%I AS TABLE public.%I', t, t);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------
-- 1. Vistas y funciones que solo existen para estas tablas
-- ---------------------------------------------------------------
DROP VIEW IF EXISTS public.v_autorizaciones_activas;
DROP VIEW IF EXISTS public.v_reconocimiento_placas;
DROP VIEW IF EXISTS public.v_desempeno_satisfaccion;
DROP FUNCTION IF EXISTS public.fn_usuario_autorizado_acceso(integer, integer, integer, timestamp without time zone);

-- ---------------------------------------------------------------
-- 2. Tablas (orden: primero las que tienen FK hacia otras de la lista)
-- ---------------------------------------------------------------
DROP TABLE IF EXISTS public.intento_ocr;               -- FK -> captura_placa
DROP TABLE IF EXISTS public.captura_placa;             -- lleva trg_captura_placa_normalizar
DROP FUNCTION IF EXISTS public.fn_normalizar_placa();  -- solo la usaba ese trigger
DROP TABLE IF EXISTS public.valoracion;                -- FK -> encuesta
DROP TABLE IF EXISTS public.encuesta;
DROP TABLE IF EXISTS public.autorizacion_acceso;
DROP TABLE IF EXISTS public.licencia_conduccion;
DROP TABLE IF EXISTS public.parqueadero_ip_autorizada;

-- #####################################################################
-- 010_eliminar_columnas_sin_uso
-- #####################################################################
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

-- =====================================================================
-- Verificación final (debe mostrar 28 tablas y ninguna de las columnas)
-- =====================================================================
DO $$
DECLARE
  n_tablas int;
  n_cols int;
BEGIN
  SELECT count(*) INTO n_tablas FROM information_schema.tables
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name NOT LIKE 'respaldo_%';
  SELECT count(*) INTO n_cols FROM information_schema.columns
   WHERE table_schema = 'public' AND (table_name, column_name) IN (
     ('parqueadero','plano_url'), ('celda','ancho'), ('vehiculo','servicio'),
     ('modulo','estado'), ('evidencia_novedad','fecha_hora'), ('conductor','regional_formacion'));
  IF n_cols <> 0 THEN
    RAISE EXCEPTION 'Quedaron % columnas que debían eliminarse; se revierte todo', n_cols;
  END IF;
  RAISE NOTICE 'Limpieza aplicada: % tablas de negocio, 0 columnas obsoletas', n_tablas;
END $$;

COMMIT;
