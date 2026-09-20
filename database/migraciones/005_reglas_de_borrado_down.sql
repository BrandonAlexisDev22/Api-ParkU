-- =====================================================================
-- Reversión de 005 — vuelve las 32 claves foráneas a NO ACTION (sin ON DELETE)
-- =====================================================================
--
-- Deshace exactamente lo que hizo 005: cada constraint recupera la forma que
-- tenía antes (sin cláusula ON DELETE, que en Postgres equivale a NO ACTION).
--
-- Las columnas que 005 volvió NULLABLES (para poder usar SET NULL) solo
-- recuperan NOT NULL si hoy no tienen ningún NULL real -- si SET NULL ya operó
-- en producción (p. ej. se borró un usuario y quedaron filas de auditoría con
-- usuario_id = NULL), forzar NOT NULL fallaría o borraría información, así que
-- ese caso se deja avisado en vez de fallar a mitad de la transacción.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- USUARIO
-- ---------------------------------------------------------------------
ALTER TABLE auditoria DROP CONSTRAINT auditoria_usuario_id_fkey;
ALTER TABLE auditoria ADD CONSTRAINT auditoria_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES usuario(id);

ALTER TABLE disponibilidad_celda DROP CONSTRAINT fk_disponibilidad_usuario;
ALTER TABLE disponibilidad_celda ADD CONSTRAINT fk_disponibilidad_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuario(id);

ALTER TABLE historial_celda DROP CONSTRAINT fk_historial_celda_usuario;
ALTER TABLE historial_celda ADD CONSTRAINT fk_historial_celda_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuario(id);

ALTER TABLE historial_disponibilidad_celda DROP CONSTRAINT fk_hist_disponibilidad_usuario;
ALTER TABLE historial_disponibilidad_celda ADD CONSTRAINT fk_hist_disponibilidad_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuario(id);

ALTER TABLE historial_novedad DROP CONSTRAINT fk_historial_novedad_usuario;
ALTER TABLE historial_novedad ADD CONSTRAINT fk_historial_novedad_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuario(id);

ALTER TABLE historial_parqueadero DROP CONSTRAINT fk_historial_parqueadero_usuario;
ALTER TABLE historial_parqueadero ADD CONSTRAINT fk_historial_parqueadero_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuario(id);

ALTER TABLE historial_reserva DROP CONSTRAINT fk_historial_reserva_usuario;
ALTER TABLE historial_reserva ADD CONSTRAINT fk_historial_reserva_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuario(id);

ALTER TABLE ocupacion_celda DROP CONSTRAINT ocupacion_celda_usuario_asigna_id_fkey;
ALTER TABLE ocupacion_celda ADD CONSTRAINT ocupacion_celda_usuario_asigna_id_fkey
  FOREIGN KEY (usuario_asigna_id) REFERENCES usuario(id);

ALTER TABLE captura_placa DROP CONSTRAINT captura_placa_usuario_verifica_id_fkey;
ALTER TABLE captura_placa ADD CONSTRAINT captura_placa_usuario_verifica_id_fkey
  FOREIGN KEY (usuario_verifica_id) REFERENCES usuario(id);

ALTER TABLE novedad DROP CONSTRAINT novedad_usuario_asignado_id_fkey;
ALTER TABLE novedad ADD CONSTRAINT novedad_usuario_asignado_id_fkey
  FOREIGN KEY (usuario_asignado_id) REFERENCES usuario(id);

ALTER TABLE registro_acceso DROP CONSTRAINT registro_acceso_usuario_salida_id_fkey;
ALTER TABLE registro_acceso ADD CONSTRAINT registro_acceso_usuario_salida_id_fkey
  FOREIGN KEY (usuario_salida_id) REFERENCES usuario(id);

ALTER TABLE reserva DROP CONSTRAINT reserva_usuario_gestiona_id_fkey;
ALTER TABLE reserva ADD CONSTRAINT reserva_usuario_gestiona_id_fkey
  FOREIGN KEY (usuario_gestiona_id) REFERENCES usuario(id);

ALTER TABLE autorizacion_acceso DROP CONSTRAINT fk_autorizacion_usuario;
ALTER TABLE autorizacion_acceso ADD CONSTRAINT fk_autorizacion_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuario(id);

ALTER TABLE conductor DROP CONSTRAINT conductor_usuario_id_fkey;
ALTER TABLE conductor ADD CONSTRAINT conductor_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES usuario(id);

ALTER TABLE notificacion DROP CONSTRAINT notificacion_usuario_id_fkey;
ALTER TABLE notificacion ADD CONSTRAINT notificacion_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES usuario(id);

ALTER TABLE recuperacion_password DROP CONSTRAINT recuperacion_password_usuario_id_fkey;
ALTER TABLE recuperacion_password ADD CONSTRAINT recuperacion_password_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES usuario(id);

ALTER TABLE asignacion_vigilante DROP CONSTRAINT asignacion_vigilante_usuario_id_fkey;
ALTER TABLE asignacion_vigilante ADD CONSTRAINT asignacion_vigilante_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES usuario(id);

ALTER TABLE valoracion DROP CONSTRAINT valoracion_usuario_id_fkey;
ALTER TABLE valoracion ADD CONSTRAINT valoracion_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES usuario(id);

ALTER TABLE registro_acceso DROP CONSTRAINT registro_acceso_usuario_ingreso_id_fkey;
ALTER TABLE registro_acceso ADD CONSTRAINT registro_acceso_usuario_ingreso_id_fkey
  FOREIGN KEY (usuario_ingreso_id) REFERENCES usuario(id);

ALTER TABLE reserva DROP CONSTRAINT reserva_usuario_id_fkey;
ALTER TABLE reserva ADD CONSTRAINT reserva_usuario_id_fkey
  FOREIGN KEY (usuario_registra_id) REFERENCES usuario(id);

ALTER TABLE novedad DROP CONSTRAINT novedad_usuario_reporta_id_fkey;
ALTER TABLE novedad ADD CONSTRAINT novedad_usuario_reporta_id_fkey
  FOREIGN KEY (usuario_reporta_id) REFERENCES usuario(id);

-- ---------------------------------------------------------------------
-- CONDUCTOR
-- ---------------------------------------------------------------------
ALTER TABLE detalle_propiedad DROP CONSTRAINT detalle_propiedad_conductor_id_fkey;
ALTER TABLE detalle_propiedad ADD CONSTRAINT detalle_propiedad_conductor_id_fkey
  FOREIGN KEY (conductor_id) REFERENCES conductor(id);

ALTER TABLE licencia_conduccion DROP CONSTRAINT licencia_conduccion_conductor_id_fkey;
ALTER TABLE licencia_conduccion ADD CONSTRAINT licencia_conduccion_conductor_id_fkey
  FOREIGN KEY (conductor_id) REFERENCES conductor(id);

ALTER TABLE autorizacion_acceso DROP CONSTRAINT fk_autorizacion_conductor;
ALTER TABLE autorizacion_acceso ADD CONSTRAINT fk_autorizacion_conductor
  FOREIGN KEY (conductor_id) REFERENCES conductor(id);

ALTER TABLE registro_acceso DROP CONSTRAINT registro_acceso_conductor_id_fkey;
ALTER TABLE registro_acceso ADD CONSTRAINT registro_acceso_conductor_id_fkey
  FOREIGN KEY (conductor_id) REFERENCES conductor(id);

ALTER TABLE reserva DROP CONSTRAINT reserva_conductor_id_fkey;
ALTER TABLE reserva ADD CONSTRAINT reserva_conductor_id_fkey
  FOREIGN KEY (conductor_id) REFERENCES conductor(id);

-- ---------------------------------------------------------------------
-- VEHÍCULO
-- ---------------------------------------------------------------------
ALTER TABLE detalle_propiedad DROP CONSTRAINT detalle_propiedad_vehiculo_id_fkey;
ALTER TABLE detalle_propiedad ADD CONSTRAINT detalle_propiedad_vehiculo_id_fkey
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id);

ALTER TABLE captura_placa DROP CONSTRAINT captura_placa_vehiculo_id_fkey;
ALTER TABLE captura_placa ADD CONSTRAINT captura_placa_vehiculo_id_fkey
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id);

ALTER TABLE registro_acceso DROP CONSTRAINT registro_acceso_vehiculo_id_fkey;
ALTER TABLE registro_acceso ADD CONSTRAINT registro_acceso_vehiculo_id_fkey
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id);

ALTER TABLE ocupacion_celda DROP CONSTRAINT ocupacion_celda_vehiculo_id_fkey;
ALTER TABLE ocupacion_celda ADD CONSTRAINT ocupacion_celda_vehiculo_id_fkey
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id);

ALTER TABLE novedad DROP CONSTRAINT novedad_vehiculo_id_fkey;
ALTER TABLE novedad ADD CONSTRAINT novedad_vehiculo_id_fkey
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id);

ALTER TABLE reserva DROP CONSTRAINT reserva_vehiculo_id_fkey;
ALTER TABLE reserva ADD CONSTRAINT reserva_vehiculo_id_fkey
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id);

-- ---------------------------------------------------------------------
-- Restaurar NOT NULL solo donde hoy no hay ningún NULL real
-- ---------------------------------------------------------------------
DO $$
DECLARE
  t RECORD;
  v_nulos BIGINT;
BEGIN
  FOR t IN
    SELECT * FROM (VALUES
      ('auditoria', 'usuario_id'),
      ('disponibilidad_celda', 'usuario_id'),
      ('historial_celda', 'usuario_id'),
      ('historial_disponibilidad_celda', 'usuario_id'),
      ('historial_novedad', 'usuario_id'),
      ('historial_parqueadero', 'usuario_id'),
      ('historial_reserva', 'usuario_id'),
      ('ocupacion_celda', 'usuario_asigna_id')
    ) AS cols(tabla, columna)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = t.tabla AND column_name = t.columna
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'SELECT count(*) FROM public.%I WHERE %I IS NULL', t.tabla, t.columna
    ) INTO v_nulos;

    IF v_nulos = 0 THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET NOT NULL', t.tabla, t.columna);
    ELSE
      RAISE NOTICE 'No se restaura NOT NULL en %.%: existen % fila(s) con NULL (SET NULL ya operó en producción).', t.tabla, t.columna, v_nulos;
    END IF;
  END LOOP;
END $$;

COMMIT;
