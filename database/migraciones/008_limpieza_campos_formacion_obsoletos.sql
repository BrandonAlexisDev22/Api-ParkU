BEGIN;

-- Las vistas v_conductor_front, v_control_placas y v_vehiculo_front dependen de las
-- columnas de formacion (pg_dump expandio `SELECT co2.*` en sus subconsultas LATERAL),
-- asi que Postgres rechazaria el DROP COLUMN. Se eliminan aqui y se recrean al final
-- seleccionando solo las columnas que cada vista realmente expone.
DROP VIEW IF EXISTS public.v_conductor_front;
DROP VIEW IF EXISTS public.v_control_placas;
DROP VIEW IF EXISTS public.v_vehiculo_front;

CREATE TABLE IF NOT EXISTS public.conductor_formacion_historica (
  id SERIAL PRIMARY KEY,
  conductor_id INTEGER NOT NULL REFERENCES public.conductor(id) ON DELETE CASCADE,
  regional_formacion VARCHAR(255),
  centro_formacion VARCHAR(255),
  programa_formacion VARCHAR(255),
  fecha_copia TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  motivo TEXT NOT NULL DEFAULT 'Limpieza de campos formativos obsoletos sin uso en la app'
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'conductor' AND column_name = 'regional_formacion') THEN
    INSERT INTO public.conductor_formacion_historica (conductor_id, regional_formacion, centro_formacion, programa_formacion)
    SELECT id, regional_formacion, centro_formacion, programa_formacion
      FROM public.conductor
     WHERE regional_formacion IS NOT NULL OR centro_formacion IS NOT NULL OR programa_formacion IS NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conductor'
      AND column_name = 'regional_formacion'
  ) THEN
    ALTER TABLE public.conductor DROP COLUMN regional_formacion;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conductor'
      AND column_name = 'centro_formacion'
  ) THEN
    ALTER TABLE public.conductor DROP COLUMN centro_formacion;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conductor'
      AND column_name = 'programa_formacion'
  ) THEN
    ALTER TABLE public.conductor DROP COLUMN programa_formacion;
  END IF;
END $$;

-- ---------------------------------------------------------------
-- Vistas recreadas sin los campos de formacion. Las subconsultas LATERAL
-- ya no arrastran `co2.*` / `ve.*`: solo las columnas que se usan.
-- ---------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_conductor_front AS
 SELECT co.id,
    co.usuario_id,
    co.nombre_apellidos AS nombre,
    co.tipo_documento,
    co.numero_documento AS identificacion,
    COALESCE(u.correo, co.correo) AS email,
    co.numero_telefonico,
    co.direccion,
    tu.nombre AS tipo_conductor,
    co.movilidad_reducida AS discapacidad,
    co.tipo_discapacidad,
    co.vigencia,
    co.estado,
    v.id AS vehiculo_id,
    v.placa,
    v.tipo AS tipo_vehiculo
   FROM public.conductor co
     LEFT JOIN public.usuario u ON u.id = co.usuario_id
     LEFT JOIN public.tipo_usuario tu ON tu.id = co.tipo_usuario_id
     LEFT JOIN LATERAL (
        SELECT ve.id, ve.placa, ve.tipo
          FROM public.detalle_propiedad dp
          JOIN public.vehiculo ve ON ve.id = dp.vehiculo_id
         WHERE dp.conductor_id = co.id AND dp.estado = true
         ORDER BY dp.es_principal DESC, dp.id
         LIMIT 1) v ON true;

CREATE OR REPLACE VIEW public.v_control_placas AS
 SELECT v.id AS vehiculo_id,
    v.placa,
    v.marca,
    v.modelo,
    v.color,
    v.tipo,
    v.estado AS vehiculo_activo,
    CASE WHEN ra.id IS NOT NULL AND ra.fecha_hora_salida IS NULL THEN 'DENTRO' ELSE 'FUERA' END AS estado_ingreso_salida,
    ra.id AS registro_acceso_id,
    ra.fecha_hora_ingreso,
    ra.fecha_hora_salida,
    p.nombre AS parqueadero,
    p.zona,
    p.piso,
    c.numero AS celda,
    co.nombre_apellidos AS propietario_conductor
   FROM public.vehiculo v
     LEFT JOIN LATERAL (
        SELECT ra2.id, ra2.parqueadero_id, ra2.celda_id, ra2.fecha_hora_ingreso, ra2.fecha_hora_salida
          FROM public.registro_acceso ra2
         WHERE ra2.vehiculo_id = v.id
         ORDER BY ra2.fecha_hora_ingreso DESC
         LIMIT 1) ra ON true
     LEFT JOIN public.parqueadero p ON p.id = ra.parqueadero_id
     LEFT JOIN public.celda c ON c.id = ra.celda_id
     LEFT JOIN LATERAL (
        SELECT co2.id, co2.nombre_apellidos
          FROM public.detalle_propiedad dp
          JOIN public.conductor co2 ON co2.id = dp.conductor_id
         WHERE dp.vehiculo_id = v.id AND dp.estado = true
         ORDER BY dp.es_principal DESC, dp.id
         LIMIT 1) co ON true;

CREATE OR REPLACE VIEW public.v_vehiculo_front AS
 SELECT v.id,
    v.placa,
    v.tipo,
    v.marca,
    v.linea AS modelo,
    v.modelo AS anio,
    v.color,
    v.observaciones AS descripcion,
    v.vehiculo_sena,
    v.estado,
    co.id AS conductor_id,
    co.nombre_apellidos AS conductor,
    ra.parqueadero_id,
    ra.celda_id,
    c.numero AS celda,
    ra.fecha_hora_ingreso AS fecha_entrada,
    (ra.id IS NOT NULL) AS esta_dentro
   FROM public.vehiculo v
     LEFT JOIN LATERAL (
        SELECT co2.id, co2.nombre_apellidos
          FROM public.detalle_propiedad dp
          JOIN public.conductor co2 ON co2.id = dp.conductor_id
         WHERE dp.vehiculo_id = v.id AND dp.estado = true
         ORDER BY dp.es_principal DESC, dp.id
         LIMIT 1) co ON true
     LEFT JOIN LATERAL (
        SELECT ra2.id, ra2.parqueadero_id, ra2.celda_id, ra2.fecha_hora_ingreso
          FROM public.registro_acceso ra2
         WHERE ra2.vehiculo_id = v.id AND ra2.fecha_hora_salida IS NULL
         ORDER BY ra2.fecha_hora_ingreso DESC
         LIMIT 1) ra ON true
     LEFT JOIN public.celda c ON c.id = ra.celda_id;

COMMIT;
