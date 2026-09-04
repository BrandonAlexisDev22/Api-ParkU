-- Migración 002: el documento pasa a ser también un dato de la CUENTA de usuario.
--
-- POR QUÉ
-- El documento vivía únicamente en `conductor`. Consecuencia: una cuenta de acceso sin
-- conductor no tenía documento en ninguna parte, y el formulario de "Nuevo conductor" no
-- podía precargarlo al seleccionar esa cuenta -- había que teclearlo a mano siempre.
--
-- QUÉ HACE (y qué NO hace)
-- Es una migración ADITIVA. Añade dos columnas NULLABLES a `usuario` y las rellena desde
-- el conductor vinculado. NO toca `conductor`: sus columnas siguen NOT NULL, conservan su
-- índice único (tipo_documento, numero_documento) y las 5 vistas que las leen
-- (v_conductor_contacto, v_conductor_front, v_control_placas, v_vehiculo_conductor,
-- v_vehiculo_front) siguen funcionando sin cambios. Ninguna función ni trigger de la base
-- usa esas columnas, así que no hay efectos en cascada.
--
-- Por eso es REVERSIBLE: deshacerla es soltar las dos columnas nuevas (ver el pie).
--
-- LA DUPLICACIÓN ES DELIBERADA
-- El mismo documento queda en las dos tablas. Se acepta porque un conductor puede existir
-- SIN cuenta (hoy hay 1 así) y necesita su propio documento, y porque quitarlo de
-- `conductor` obligaría a reescribir 5 vistas y ~100 referencias en 15 archivos. La
-- coherencia entre ambas copias la mantiene la aplicación dentro de la misma transacción
-- -- ver usuario.service.js y conductor.service.js.
--
-- Idempotente: se puede correr varias veces sin efecto.

ALTER TABLE public.usuario
  ADD COLUMN IF NOT EXISTS tipo_documento public.tipo_documento_enum,
  ADD COLUMN IF NOT EXISTS numero_documento VARCHAR(20);

-- Relleno desde el conductor vinculado. Solo escribe donde todavía no hay nada, para que
-- una segunda ejecución no pise datos capturados después directamente en la cuenta.
UPDATE public.usuario u
   SET tipo_documento   = c.tipo_documento,
       numero_documento = c.numero_documento
  FROM public.conductor c
 WHERE c.usuario_id = u.id
   AND u.numero_documento IS NULL;

-- Dos cuentas no pueden compartir documento. Parcial (WHERE ... IS NOT NULL) porque las
-- cuentas sin documento son válidas y no deben chocar entre ellas.
CREATE UNIQUE INDEX IF NOT EXISTS usuario_documento_idx
  ON public.usuario (tipo_documento, numero_documento)
  WHERE numero_documento IS NOT NULL;

COMMENT ON COLUMN public.usuario.numero_documento IS
  'Documento del titular de la cuenta. Se mantiene sincronizado con el del Conductor vinculado, si lo hay (la aplicación escribe ambos en la misma transacción). Puede existir sin conductor: es lo que permite precargarlo al registrar a esa persona como conductor.';

-- PARA DESHACER:
--   DROP INDEX IF EXISTS public.usuario_documento_idx;
--   ALTER TABLE public.usuario DROP COLUMN IF EXISTS numero_documento, DROP COLUMN IF EXISTS tipo_documento;
