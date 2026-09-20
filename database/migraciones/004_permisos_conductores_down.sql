-- Reversión de 004: quita los permisos del módulo de Conductores.
--
-- Solo segura si ningún rol (aparte de la asignación automática al
-- Administrador que hizo la propia 004) ha llegado a usar estos permisos.
-- Si algún rol personalizado ya los tiene marcados, revertir se los quita
-- sin aviso -- revisa antes con:
--   SELECT rol_id FROM rol_permiso rp JOIN permiso p ON p.id = rp.permiso_id
--    WHERE p.nombre LIKE 'conductores.%' AND rp.estado = TRUE AND rp.rol_id <> 1;
BEGIN;

DELETE FROM rol_permiso
 WHERE permiso_id IN (SELECT id FROM permiso WHERE nombre LIKE 'conductores.%');

DELETE FROM permiso
 WHERE nombre LIKE 'conductores.%';

COMMIT;
