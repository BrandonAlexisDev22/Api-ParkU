-- =====================================================================
-- 005 — Qué pasa con lo que cuelga de un usuario, un conductor o un
--       vehículo cuando se borra
-- =====================================================================
--
-- Las 32 claves foráneas que apuntan a estas tres tablas eran todas NO ACTION:
-- cualquier fila colgando bloqueaba el borrado, sin distinguir entre una
-- operación del parqueadero y un rastro técnico. En la práctica una cuenta se
-- volvía imposible de borrar en cuanto su dueño tocaba algo.
--
-- El criterio, en tres reglas:
--
--   RESTRICT  Operaciones del negocio: entradas y salidas, parqueos, reservas y
--             novedades. Son el registro de lo que pasó en el parqueadero, así
--             que antes que borrarlas se prefiere no poder borrar la ficha.
--
--   SET NULL  Rastros de AUTORÍA sobre cosas que siguen existiendo: la auditoría
--             y los historiales guardan "quién cambió esta celda", no "esto es de
--             este usuario". Con CASCADE, borrar a un vigilante borraría el
--             historial de las celdas que tocó -- y esas celdas siguen ahí. Con
--             SET NULL el historial se conserva y solo pierde el nombre.
--
--   CASCADE   Filas que no significan nada sin su dueño: notificaciones, tokens,
--             turnos de vigilancia, valoraciones, licencias y los vínculos de
--             propiedad (el vínculo, no el vehículo).
--
-- Todo es reversible: al pie está el bloque para volver a NO ACTION.

-- ---------------------------------------------------------------------
-- 1. Las columnas que pasarán a SET NULL tienen que admitir NULL
-- ---------------------------------------------------------------------
ALTER TABLE auditoria                      ALTER COLUMN usuario_id        DROP NOT NULL;
ALTER TABLE disponibilidad_celda           ALTER COLUMN usuario_id        DROP NOT NULL;
ALTER TABLE historial_celda                ALTER COLUMN usuario_id        DROP NOT NULL;
ALTER TABLE historial_disponibilidad_celda ALTER COLUMN usuario_id        DROP NOT NULL;
ALTER TABLE historial_novedad              ALTER COLUMN usuario_id        DROP NOT NULL;
ALTER TABLE historial_parqueadero          ALTER COLUMN usuario_id        DROP NOT NULL;
ALTER TABLE historial_reserva              ALTER COLUMN usuario_id        DROP NOT NULL;
ALTER TABLE ocupacion_celda                ALTER COLUMN usuario_asigna_id DROP NOT NULL;

-- ---------------------------------------------------------------------
-- 2. USUARIO
-- ---------------------------------------------------------------------

-- Autoría que sobrevive a la cuenta -> SET NULL
ALTER TABLE auditoria DROP CONSTRAINT auditoria_usuario_id_fkey;
ALTER TABLE auditoria ADD CONSTRAINT auditoria_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL;

ALTER TABLE disponibilidad_celda DROP CONSTRAINT fk_disponibilidad_usuario;
ALTER TABLE disponibilidad_celda ADD CONSTRAINT fk_disponibilidad_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL;

ALTER TABLE historial_celda DROP CONSTRAINT fk_historial_celda_usuario;
ALTER TABLE historial_celda ADD CONSTRAINT fk_historial_celda_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL;

ALTER TABLE historial_disponibilidad_celda DROP CONSTRAINT fk_hist_disponibilidad_usuario;
ALTER TABLE historial_disponibilidad_celda ADD CONSTRAINT fk_hist_disponibilidad_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL;

ALTER TABLE historial_novedad DROP CONSTRAINT fk_historial_novedad_usuario;
ALTER TABLE historial_novedad ADD CONSTRAINT fk_historial_novedad_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL;

ALTER TABLE historial_parqueadero DROP CONSTRAINT fk_historial_parqueadero_usuario;
ALTER TABLE historial_parqueadero ADD CONSTRAINT fk_historial_parqueadero_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL;

ALTER TABLE historial_reserva DROP CONSTRAINT fk_historial_reserva_usuario;
ALTER TABLE historial_reserva ADD CONSTRAINT fk_historial_reserva_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL;

ALTER TABLE ocupacion_celda DROP CONSTRAINT ocupacion_celda_usuario_asigna_id_fkey;
ALTER TABLE ocupacion_celda ADD CONSTRAINT ocupacion_celda_usuario_asigna_id_fkey
  FOREIGN KEY (usuario_asigna_id) REFERENCES usuario(id) ON DELETE SET NULL;

ALTER TABLE captura_placa DROP CONSTRAINT captura_placa_usuario_verifica_id_fkey;
ALTER TABLE captura_placa ADD CONSTRAINT captura_placa_usuario_verifica_id_fkey
  FOREIGN KEY (usuario_verifica_id) REFERENCES usuario(id) ON DELETE SET NULL;

ALTER TABLE novedad DROP CONSTRAINT novedad_usuario_asignado_id_fkey;
ALTER TABLE novedad ADD CONSTRAINT novedad_usuario_asignado_id_fkey
  FOREIGN KEY (usuario_asignado_id) REFERENCES usuario(id) ON DELETE SET NULL;

ALTER TABLE registro_acceso DROP CONSTRAINT registro_acceso_usuario_salida_id_fkey;
ALTER TABLE registro_acceso ADD CONSTRAINT registro_acceso_usuario_salida_id_fkey
  FOREIGN KEY (usuario_salida_id) REFERENCES usuario(id) ON DELETE SET NULL;

ALTER TABLE reserva DROP CONSTRAINT reserva_usuario_gestiona_id_fkey;
ALTER TABLE reserva ADD CONSTRAINT reserva_usuario_gestiona_id_fkey
  FOREIGN KEY (usuario_gestiona_id) REFERENCES usuario(id) ON DELETE SET NULL;

ALTER TABLE autorizacion_acceso DROP CONSTRAINT fk_autorizacion_usuario;
ALTER TABLE autorizacion_acceso ADD CONSTRAINT fk_autorizacion_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL;

-- El conductor es una PERSONA, la cuenta es un acceso: borrar el acceso no borra
-- a la persona, solo la desvincula.
ALTER TABLE conductor DROP CONSTRAINT conductor_usuario_id_fkey;
ALTER TABLE conductor ADD CONSTRAINT conductor_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL;

-- Filas que no significan nada sin la cuenta -> CASCADE
ALTER TABLE notificacion DROP CONSTRAINT notificacion_usuario_id_fkey;
ALTER TABLE notificacion ADD CONSTRAINT notificacion_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE;

ALTER TABLE recuperacion_password DROP CONSTRAINT recuperacion_password_usuario_id_fkey;
ALTER TABLE recuperacion_password ADD CONSTRAINT recuperacion_password_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE;

ALTER TABLE asignacion_vigilante DROP CONSTRAINT asignacion_vigilante_usuario_id_fkey;
ALTER TABLE asignacion_vigilante ADD CONSTRAINT asignacion_vigilante_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE;

ALTER TABLE valoracion DROP CONSTRAINT valoracion_usuario_id_fkey;
ALTER TABLE valoracion ADD CONSTRAINT valoracion_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE;

-- Operaciones -> RESTRICT (explícito: NO ACTION bloqueaba igual, pero se puede
-- diferir al final de la transacción y aquí no queremos esa ambigüedad)
ALTER TABLE registro_acceso DROP CONSTRAINT registro_acceso_usuario_ingreso_id_fkey;
ALTER TABLE registro_acceso ADD CONSTRAINT registro_acceso_usuario_ingreso_id_fkey
  FOREIGN KEY (usuario_ingreso_id) REFERENCES usuario(id) ON DELETE RESTRICT;

ALTER TABLE reserva DROP CONSTRAINT reserva_usuario_id_fkey;
ALTER TABLE reserva ADD CONSTRAINT reserva_usuario_id_fkey
  FOREIGN KEY (usuario_registra_id) REFERENCES usuario(id) ON DELETE RESTRICT;

ALTER TABLE novedad DROP CONSTRAINT novedad_usuario_reporta_id_fkey;
ALTER TABLE novedad ADD CONSTRAINT novedad_usuario_reporta_id_fkey
  FOREIGN KEY (usuario_reporta_id) REFERENCES usuario(id) ON DELETE RESTRICT;

-- ---------------------------------------------------------------------
-- 3. CONDUCTOR
--    Borrar un conductor NO borra su cuenta (la FK va del conductor a la
--    cuenta, no al revés) ni sus vehículos: solo el vínculo de propiedad.
-- ---------------------------------------------------------------------
ALTER TABLE detalle_propiedad DROP CONSTRAINT detalle_propiedad_conductor_id_fkey;
ALTER TABLE detalle_propiedad ADD CONSTRAINT detalle_propiedad_conductor_id_fkey
  FOREIGN KEY (conductor_id) REFERENCES conductor(id) ON DELETE CASCADE;

ALTER TABLE licencia_conduccion DROP CONSTRAINT licencia_conduccion_conductor_id_fkey;
ALTER TABLE licencia_conduccion ADD CONSTRAINT licencia_conduccion_conductor_id_fkey
  FOREIGN KEY (conductor_id) REFERENCES conductor(id) ON DELETE CASCADE;

ALTER TABLE autorizacion_acceso DROP CONSTRAINT fk_autorizacion_conductor;
ALTER TABLE autorizacion_acceso ADD CONSTRAINT fk_autorizacion_conductor
  FOREIGN KEY (conductor_id) REFERENCES conductor(id) ON DELETE SET NULL;

ALTER TABLE registro_acceso DROP CONSTRAINT registro_acceso_conductor_id_fkey;
ALTER TABLE registro_acceso ADD CONSTRAINT registro_acceso_conductor_id_fkey
  FOREIGN KEY (conductor_id) REFERENCES conductor(id) ON DELETE RESTRICT;

ALTER TABLE reserva DROP CONSTRAINT reserva_conductor_id_fkey;
ALTER TABLE reserva ADD CONSTRAINT reserva_conductor_id_fkey
  FOREIGN KEY (conductor_id) REFERENCES conductor(id) ON DELETE RESTRICT;

-- ---------------------------------------------------------------------
-- 4. VEHÍCULO
-- ---------------------------------------------------------------------
ALTER TABLE detalle_propiedad DROP CONSTRAINT detalle_propiedad_vehiculo_id_fkey;
ALTER TABLE detalle_propiedad ADD CONSTRAINT detalle_propiedad_vehiculo_id_fkey
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id) ON DELETE CASCADE;

ALTER TABLE captura_placa DROP CONSTRAINT captura_placa_vehiculo_id_fkey;
ALTER TABLE captura_placa ADD CONSTRAINT captura_placa_vehiculo_id_fkey
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id) ON DELETE SET NULL;

ALTER TABLE registro_acceso DROP CONSTRAINT registro_acceso_vehiculo_id_fkey;
ALTER TABLE registro_acceso ADD CONSTRAINT registro_acceso_vehiculo_id_fkey
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id) ON DELETE RESTRICT;

ALTER TABLE ocupacion_celda DROP CONSTRAINT ocupacion_celda_vehiculo_id_fkey;
ALTER TABLE ocupacion_celda ADD CONSTRAINT ocupacion_celda_vehiculo_id_fkey
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id) ON DELETE RESTRICT;

ALTER TABLE novedad DROP CONSTRAINT novedad_vehiculo_id_fkey;
ALTER TABLE novedad ADD CONSTRAINT novedad_vehiculo_id_fkey
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id) ON DELETE RESTRICT;

ALTER TABLE reserva DROP CONSTRAINT reserva_vehiculo_id_fkey;
ALTER TABLE reserva ADD CONSTRAINT reserva_vehiculo_id_fkey
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id) ON DELETE RESTRICT;

-- ---------------------------------------------------------------------
-- Comprobación
-- ---------------------------------------------------------------------
SELECT ccu.table_name AS apunta_a, tc.table_name AS tabla, kcu.column_name AS columna, rc.delete_rule
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name
  JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
  JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
 WHERE tc.constraint_type = 'FOREIGN KEY'
   AND ccu.table_name IN ('usuario', 'conductor', 'vehiculo')
 ORDER BY 1, 4, 2;

-- =====================================================================
-- Para deshacer: volver cada constraint a su forma sin ON DELETE, p. ej.
--   ALTER TABLE auditoria DROP CONSTRAINT auditoria_usuario_id_fkey;
--   ALTER TABLE auditoria ADD  CONSTRAINT auditoria_usuario_id_fkey
--     FOREIGN KEY (usuario_id) REFERENCES usuario(id);
-- y devolver los NOT NULL del punto 1 (solo si no quedan filas con NULL).
-- =====================================================================
