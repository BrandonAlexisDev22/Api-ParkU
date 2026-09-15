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

BEGIN;

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

COMMIT;
