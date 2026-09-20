-- =====================================================================
-- Reversión de 006 (reconstrucción best-effort — LEER ANTES DE EJECUTAR)
-- =====================================================================
--
-- 006 no dejó guardada la definición exacta de las funciones tal como
-- estaban ANTES del cambio (el repositorio no versionaba las funciones de
-- base de datos como código antes de esta migración), así que este down NO
-- es una restauración exacta byte a byte: es una reconstrucción hecha a
-- partir de la propia descripción del comportamiento "antiguo" que trae el
-- encabezado de 006_reservas_por_franja.sql. Antes de correrlo en
-- producción, compara esta lógica con cualquier respaldo real de la función
-- que exista (branch de Neon anterior a 006, o un pg_dump previo).
--
-- Comportamiento que se restaura:
--   - Aceptar una reserva vuelve a marcar la celda como RESERVADA.
--   - La validación de ocupación vuelve a mirar el estado de la celda
--     (RESERVADA) en vez de consultar la agenda por horario.
--   - El conflicto entre reservas vuelve a comprobarse contra PENDIENTE y
--     ACEPTADA por igual (quien pide primero bloquea la franja).
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_reserva_bloquea_celda()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.estado = 'ACEPTADA' AND OLD.estado IS DISTINCT FROM 'ACEPTADA' THEN
        UPDATE celda SET estado = 'RESERVADA' WHERE id = NEW.celda_id;
    END IF;

    IF TG_OP = 'UPDATE'
       AND OLD.estado = 'ACEPTADA'
       AND NEW.estado IN ('CANCELADA','RECHAZADA','TERMINADA') THEN
        UPDATE celda SET estado = 'DISPONIBLE'
         WHERE id = NEW.celda_id AND estado = 'RESERVADA';
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_validar_ocupacion_celda()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    v_estado_celda  estado_celda_enum;
    v_tipo_celda    tipo_vehiculo_enum;
    v_usabilidad    usabilidad_enum;
    v_tipo_vehiculo tipo_vehiculo_enum;
    v_numero        VARCHAR(10);
    v_reservada_por INT;
    v_conductor_id  INT;
    v_apto          BOOLEAN;
    v_nombre        VARCHAR(200);
BEGIN
    SELECT c.estado, c.tipo, c.usabilidad, c.numero
      INTO v_estado_celda, v_tipo_celda, v_usabilidad, v_numero
      FROM celda c WHERE c.id = NEW.celda_id;

    IF v_estado_celda IS NULL THEN
        RAISE EXCEPTION 'La celda % no existe.', NEW.celda_id;
    END IF;

    SELECT v.tipo INTO v_tipo_vehiculo FROM vehiculo v WHERE v.id = NEW.vehiculo_id;
    IF v_tipo_vehiculo IS NULL THEN
        RAISE EXCEPTION 'El vehiculo % no existe.', NEW.vehiculo_id;
    END IF;

    IF v_estado_celda IN ('MANTENIMIENTO','INACTIVA') THEN
        RAISE EXCEPTION 'La celda % esta en % y no admite ocupacion.',
                        v_numero, v_estado_celda;
    END IF;

    IF EXISTS (SELECT 1 FROM ocupacion_celda oc
               WHERE oc.celda_id = NEW.celda_id AND oc.estado = 'ACTIVA'
                 AND oc.id IS DISTINCT FROM NEW.id) THEN
        RAISE EXCEPTION 'La celda % ya tiene una ocupacion activa.', v_numero;
    END IF;

    -- Comportamiento pre-006: la celda RESERVADA solo la usa quien la reservó.
    IF v_estado_celda = 'RESERVADA' THEN
        SELECT r.vehiculo_id INTO v_reservada_por
          FROM reserva r
         WHERE r.celda_id = NEW.celda_id AND r.estado = 'ACEPTADA'
         ORDER BY r.fecha_hora_inicio DESC
         LIMIT 1;

        IF v_reservada_por IS NOT NULL
           AND v_reservada_por IS DISTINCT FROM NEW.vehiculo_id THEN
            RAISE EXCEPTION 'La celda % esta reservada para otro vehiculo.', v_numero;
        END IF;
    END IF;

    IF v_tipo_celda <> v_tipo_vehiculo THEN
        RAISE EXCEPTION
          'El tipo de vehiculo (%) no corresponde con el tipo de la celda % (%).',
          v_tipo_vehiculo, v_numero, v_tipo_celda;
    END IF;

    IF v_usabilidad = 'MOVILIDAD_REDUCIDA' THEN
        SELECT ra.conductor_id INTO v_conductor_id
          FROM registro_acceso ra WHERE ra.id = NEW.registro_acceso_id;

        IF v_conductor_id IS NULL THEN
            SELECT dp.conductor_id INTO v_conductor_id
              FROM detalle_propiedad dp
             WHERE dp.vehiculo_id = NEW.vehiculo_id
               AND dp.es_principal = TRUE AND dp.estado = TRUE
             LIMIT 1;
        END IF;

        IF v_conductor_id IS NULL THEN
            RAISE EXCEPTION
              'La celda % es de movilidad reducida: se requiere identificar al conductor.', v_numero;
        END IF;

        SELECT co.movilidad_reducida, co.nombre_apellidos
          INTO v_apto, v_nombre
          FROM conductor co WHERE co.id = v_conductor_id;

        IF NOT COALESCE(v_apto, FALSE) THEN
            RAISE EXCEPTION
              'La celda % es de caracter preferencial y % no tiene registrada condicion de movilidad reducida.',
              v_numero, v_nombre;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_validar_conflicto_reserva()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "reserva" r
        WHERE r.id <> COALESCE(NEW.id, -1)
          AND r.celda_id = NEW.celda_id
          AND r.estado IN ('PENDIENTE', 'ACEPTADA')
          AND NEW.fecha_hora_inicio < r.fecha_hora_fin
          AND NEW.fecha_hora_fin > r.fecha_hora_inicio
    ) THEN
        RAISE EXCEPTION 'La celda % ya tiene una reserva que se sobrepone al rango solicitado.', NEW.celda_id;
    END IF;

    RETURN NEW;
END;
$function$;

COMMIT;
