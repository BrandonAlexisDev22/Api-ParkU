# Limpieza de campos obsoletos de conductor

## Campos que se mantienen

Se conservan en el flujo real de la app los siguientes campos del conductor:

- id
- usuario_id
- tipo_documento
- numero_documento
- nombre_apellidos
- correo
- direccion
- numero_telefonico
- tipo_usuario_id
- vigencia
- movilidad_reducida
- tipo_discapacidad
- estado

Además, el backend sigue aceptando los campos de request `crear_cuenta`, `confirmar_contrasena`, `contrasena` y `sin_cuenta` para decidir cómo se crea la cuenta de acceso, pero no son columnas de la tabla `conductor`.

## Campos eliminados

Se elimina la limpieza de la tabla `conductor` para estas columnas porque no forman parte del contrato que consume la app actual:

- `regional_formacion`
- `centro_formacion`
- `programa_formacion`

## Por qué ya no se usan

La API actual no los escribe ni los lee en ninguna lectura, escritura ni validación del flujo activo. La lógica real del backend ignora esos valores al crear y actualizar conductores, y el formulario actual no los envía en ninguna operación conocida por la aplicación.

## Migración segura ejecutada

Se crea una tabla histórica `public.conductor_formacion_historica` y se copia el contenido previo antes de borrar columnas de la tabla principal. Esto evita pérdida irreversible de datos si más adelante se requiere auditoría o consulta histórica.

### SQL exacto

Ver el archivo [database/migraciones/008_limpieza_campos_formacion_obsoletos.sql](../database/migraciones/008_limpieza_campos_formacion_obsoletos.sql).

## Impacto en la API

- El modelo Sequelize de `Conductor` ya no expone esos tres campos.
- Los repositorios y validaciones dejan de aceptar esos atributos.
- Los payloads Swagger no los documentan más.
- Los seed/demo y scripts de carga actualizados no insertan esos datos.

Este cambio es compatible con el flujo real de la app porque los campos eliminados no se usan hoy en ningún formulario, endpoint ni validación de negocio.
