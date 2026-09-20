-- Reversión de 003: vuelve a llamar "Comunidad sena" al rol 3.
-- Solo cambia el nombre de la fila; el id y los permisos no se tocan.
BEGIN;

UPDATE rol
   SET nombre = 'Comunidad sena'
 WHERE id = 3
   AND nombre = 'Conductor';

COMMIT;
