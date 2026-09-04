-- =====================================================================
-- 003 — El rol 3 pasa a llamarse "Conductor" (antes "Comunidad sena")
-- =====================================================================
--
-- Solo cambia el NOMBRE de una fila. No toca ids, ni permisos, ni ninguna
-- estructura: `usuario.rol_id` sigue apuntando al 3 y todo lo que autoriza por
-- ROLES.CONDUCTOR (= 3) sigue funcionando igual.
--
-- Se renombra porque es el nombre que ve la gente en la aplicación, y "Comunidad
-- SENA" no decía lo que ese rol hace: es quien parquea. El código nunca dependió
-- del texto (autoriza por id), y quien envíe el nombre viejo lo sigue teniendo
-- cubierto por ALIAS_ROL en src/config/roles.js.
--
-- Idempotente: si ya está renombrado, no hace nada.

UPDATE rol
   SET nombre = 'Conductor'
 WHERE id = 3
   AND nombre ILIKE 'comunidad%';

-- Comprobación
SELECT id, nombre, estado FROM rol WHERE id IN (1, 2, 3) ORDER BY id;

-- =====================================================================
-- Para deshacer:
--   UPDATE rol SET nombre = 'Comunidad sena' WHERE id = 3;
-- =====================================================================
