-- Reversión de 002: quita el documento de la cuenta de usuario.
--
-- El documento vuelve a vivir solo en `conductor` (donde sigue estando: 002
-- nunca lo tocó allí). No hay pérdida de datos irrecuperable porque el mismo
-- valor sigue en `conductor.numero_documento` / `conductor.tipo_documento`
-- para cualquier fila que tenga conductor vinculado; solo se pierde el dato
-- para una cuenta SIN conductor (hoy hay como mucho la que 002 documentaba).
BEGIN;

DROP INDEX IF EXISTS public.usuario_documento_idx;

ALTER TABLE public.usuario
  DROP COLUMN IF EXISTS numero_documento,
  DROP COLUMN IF EXISTS tipo_documento;

COMMIT;
