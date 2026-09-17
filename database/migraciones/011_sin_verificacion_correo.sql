-- =====================================================================
-- 011 · Se retira la verificación de correo
-- =====================================================================
-- Los correos de ParkU pasan a ser solo avisos de información para el
-- conductor (ingreso/salida de su vehículo, estado de su reserva). Ya no se
-- pide confirmar el correo al registrarse (auth.controller.js crea la cuenta
-- con correo_verificado = true), así que las cuentas existentes se dan por
-- verificadas para que ninguna pantalla les siga pidiendo el paso.
--
-- La columna y la tabla verificacion_correo se conservan: son inocuas y
-- permiten revertir (011_sin_verificacion_correo_down.sql).
-- =====================================================================
BEGIN;

UPDATE usuario
   SET correo_verificado = TRUE
 WHERE correo_verificado IS DISTINCT FROM TRUE;

-- Tokens de verificación pendientes: ya no se van a canjear.
DELETE FROM verificacion_correo;

COMMIT;
