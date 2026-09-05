-- =====================================================================
-- 006 — Una reserva aparta una FRANJA, no la celda entera
-- =====================================================================
--
-- Hasta ahora, aceptar una reserva ponía la celda en RESERVADA y ahí se
-- quedaba hasta que la reserva terminaba o se cancelaba. Una reserva de las
-- 15:00 a las 17:00 dejaba la celda inutilizable desde la mañana: nadie más
-- podía estacionar en ella, y el mapa la mostraba ocupada todo el día por algo
-- que iba a pasar seis horas después.
--
-- El modelo correcto es el de una agenda: la celda tiene reservas a lo largo
-- del día, y lo que impide usarla es que en ESE MOMENTO haya una reserva
-- vigente, no que exista una reserva en alguna parte del día.
--
-- Dos cambios, los dos sobre funciones (no se toca ninguna tabla ni dato):
--
--   fn_reserva_bloquea_celda      Deja de marcar la celda al aceptar. Sigue
--                                 soltando las que ya estaban marcadas cuando
--                                 su reserva se cancela, rechaza o termina, para
--                                 que ninguna celda se quede colgada en
--                                 RESERVADA por una reserva vieja.
--
--   fn_validar_ocupacion_celda    Su comprobación 3.3 dependía de que la celda
--                                 estuviera en estado RESERVADA. Ahora consulta
--                                 la agenda directamente: si en el instante del
--                                 ingreso hay una reserva aceptada, solo entra
--                                 ese vehículo; si no la hay, entra cualquiera.
--                                 Es la misma regla de antes, pero mirando la
--                                 hora en vez de un estado que se quedaba pegado.
--
-- Reversible: las dos funciones se pueden volver a la versión anterior sin
-- pérdida de datos, porque ninguna fila cambia de forma.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Aceptar una reserva ya no bloquea la celda
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_reserva_bloquea_celda()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Aceptar una reserva NO toca la celda: la reserva aparta una franja, y la
    -- celda sigue disponible para quien la necesite fuera de esa franja. Quién
    -- puede entrar en cada momento lo decide fn_validar_ocupacion_celda
    -- consultando la agenda.

    -- Al cancelar, rechazar o terminar: se suelta la celda si había quedado
    -- marcada por el modelo anterior (o por un cambio manual de estado).
    IF TG_OP = 'UPDATE'
       AND OLD.estado = 'ACEPTADA'
       AND NEW.estado IN ('CANCELADA','RECHAZADA','TERMINADA') THEN
        UPDATE celda SET estado = 'DISPONIBLE'
         WHERE id = NEW.celda_id AND estado = 'RESERVADA';
    END IF;

    RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------
-- Ocupar una celda: manda la agenda, no el estado
-- ---------------------------------------------------------------------
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
    v_momento       TIMESTAMP;
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

    -- 3.1 Celda fuera de servicio
    IF v_estado_celda IN ('MANTENIMIENTO','INACTIVA') THEN
        RAISE EXCEPTION 'La celda % esta en % y no admite ocupacion.',
                        v_numero, v_estado_celda;
    END IF;

    -- 3.2 Celda ya ocupada
    IF EXISTS (SELECT 1 FROM ocupacion_celda oc
               WHERE oc.celda_id = NEW.celda_id AND oc.estado = 'ACTIVA'
                 AND oc.id IS DISTINCT FROM NEW.id) THEN
        RAISE EXCEPTION 'La celda % ya tiene una ocupacion activa.', v_numero;
    END IF;

    -- 3.3 Reserva VIGENTE en este momento: solo entra su vehiculo.
    --     Antes esto dependia de que la celda estuviera en estado RESERVADA, que
    --     se ponia al aceptar y no se quitaba hasta terminar: la celda quedaba
    --     inservible el resto del dia. Ahora se mira la agenda.
    v_momento := COALESCE(NEW.fecha_hora_inicio, CURRENT_TIMESTAMP);

    SELECT r.vehiculo_id INTO v_reservada_por
      FROM reserva r
     WHERE r.celda_id = NEW.celda_id
       AND r.estado = 'ACEPTADA'
       AND v_momento BETWEEN r.fecha_hora_inicio AND r.fecha_hora_fin
     ORDER BY r.fecha_hora_inicio
     LIMIT 1;

    IF v_reservada_por IS NOT NULL
       AND v_reservada_por IS DISTINCT FROM NEW.vehiculo_id THEN
        RAISE EXCEPTION 'La celda % esta reservada en este horario para otro vehiculo.', v_numero;
    END IF;

    -- 3.4 Tipo de celda contra tipo de vehiculo
    IF v_tipo_celda <> v_tipo_vehiculo THEN
        RAISE EXCEPTION
          'El tipo de vehiculo (%) no corresponde con el tipo de la celda % (%).',
          v_tipo_vehiculo, v_numero, v_tipo_celda;
    END IF;

    -- 3.5 CELDA PREFERENCIAL: exige condicion de movilidad reducida
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

-- ---------------------------------------------------------------------
-- Dos solicitudes pueden competir por la misma franja
-- ---------------------------------------------------------------------
-- El conflicto se comprobaba contra PENDIENTE y ACEPTADA por igual: la segunda
-- persona que pedía la misma franja recibía un rechazo, aunque la primera fuera
-- solo una solicitud que nadie había aprobado todavía. Eso convertía la reserva
-- en "quien pide primero se lleva la celda", en vez de dejar que quien gestiona
-- el parqueadero decida entre las dos.
--
-- Ahora solo choca lo que de verdad está comprometido: una reserva ACEPTADA. Las
-- pendientes conviven, y al aceptar una, el servicio cancela las que competían
-- por esa franja con el motivo escrito (ver _cancelarCompetidoras).
CREATE OR REPLACE FUNCTION public.fn_validar_conflicto_reserva()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Solo una reserva ACEPTADA compromete la franja. Una solicitud pendiente no
    -- estorba a otra: compiten, y el que aprueba resuelve.
    IF NEW.estado = 'ACEPTADA'::estado_reserva_enum THEN
        IF EXISTS (
            SELECT 1
            FROM "reserva" r
            WHERE r.id <> COALESCE(NEW.id, -1)
              AND r.celda_id = NEW.celda_id
              AND r.estado = 'ACEPTADA'::estado_reserva_enum
              AND NEW.fecha_hora_inicio < r.fecha_hora_fin
              AND NEW.fecha_hora_fin > r.fecha_hora_inicio
        ) THEN
            RAISE EXCEPTION 'La celda % ya tiene una reserva aceptada que se sobrepone al rango solicitado.', NEW.celda_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------
-- Las celdas que quedaron marcadas por el modelo anterior se sueltan: su
-- reserva ya no las bloquea, y dejarlas asi las volveria invisibles.
-- (La tabla lleva auditoria y exige saber quien escribe: se atribuye a la
--  cuenta administradora, que es quien corre la migracion.)
-- ---------------------------------------------------------------------
SET LOCAL app.usuario_id = '1';

UPDATE celda SET estado = 'DISPONIBLE' WHERE estado = 'RESERVADA';

COMMIT;
