# Limpieza de esquema: migraciones 009 y 010

Resultado de contrastar la lista de "tablas/columnas que el frontend no usa" contra
(a) la BD real en Neon (introspección de solo lectura, 2026-09-15) y (b) el código de
`src/`. El dump `database/parku.postgres` estaba desactualizado (le faltaban
`novedad.clase/tipo_otro`, `usuario.foto_perfil_url`, `verificacion_correo`, etc.), así
que la referencia fue la BD viva.

## Qué eliminan

**009 – tablas** (ninguna referencia en `src/`, ningún trigger que escriba en ellas):
`autorizacion_acceso`, `captura_placa`, `intento_ocr`, `encuesta`, `valoracion`,
`licencia_conduccion`, `parqueadero_ip_autorizada`, más sus objetos huérfanos
(`v_autorizaciones_activas`, `v_reconocimiento_placas`, `v_desempeno_satisfaccion`,
`fn_usuario_autorizado_acceso`, `fn_normalizar_placa`). Los datos quedan en
`respaldo_009_*`.

**010 – columnas** (solo aparecían en el modelo Sequelize, en `allowedFields` o en el seed):

| Tabla | Columnas |
|---|---|
| parqueadero | plano_url, observaciones |
| celda | posicion_x, posicion_y, ancho, alto (+ `ck_celda_posiciones`) |
| conductor | fecha_creacion |
| detalle_propiedad | fecha_registro |
| vehiculo | tarjeta_propiedad, cilindraje, servicio, carroceria, combustible, capacidad, numero_motor, numero_chasis |
| rol / rol_permiso | fecha_creacion / fecha_asignacion |
| modulo, tipo_usuario | descripcion, estado |
| evidencia_novedad | fecha_hora (el listado ahora ordena por `id DESC`) |

Los valores no nulos quedan en `respaldo_010_*`. Cada migración tiene su `_down.sql`.

## Qué se excluyó de la lista original y por qué

| Ítem | Motivo |
|---|---|
| `auditoria` | `GET /api/auditoria`; `fn_auditoria_generica` escribe en cada INSERT/UPDATE/DELETE de celda, parqueadero, registro_acceso, reserva y vehiculo. Borrarla rompe esas escrituras. |
| `notificacion` | `GET/PATCH /api/notificaciones`; `trg_notificar_cambio_novedad` y `trg_notificar_cambio_reserva` insertan en ella. |
| `historial_celda/_parqueadero/_reserva/_novedad` | Triggers `fn_historial_*` en cada escritura; endpoints `GET /.../:id/historial`. |
| `historial_disponibilidad_celda` | `fn_sincronizar_disponibilidad` la escribe al usar `PUT /celdas/:id/disponibilidad`. |
| `asignacion_vigilante` | CRUD completo en `/api/asignaciones-vigilante`. |
| `equipamiento_parqueadero` | `GET /parqueaderos/:id/equipamiento`, `PUT/DELETE /api/equipamiento/:id`. |
| `novedad.registro_acceso_id` | Núcleo de `monitoreo.service.js` (novedad automática por vehículo fuera de horario, dedupe por `findByRegistroAcceso`). |
| `novedad.fecha_hora_cierre` | Se fija al cerrar/cancelar una novedad. |
| `registro_acceso.descripcion_ingreso/salida` | La "minuta" ya está implementada: las reciben `POST /entradas-salidas/ingreso` y `/salida`. Pendiente de tu confirmación. |
| `vehiculo.vehiculo_sena` | Marcado "PREGÚNTAME"; sin decisión, se conserva. |
| `vehiculo.fecha_creacion` | Estaba en ambas listas (borrar y NO borrar); alimenta `trg_vehiculo_auditoria`, se conserva. |

Si se decide borrar alguno de estos, implica además eliminar triggers/funciones y módulos
completos del backend (rutas, controllers, services, repositorios, `dbContext.util.js`).

## Notas

- La migración **008** (campos de formación de `conductor`) no estaba aplicada en Neon y
  fallaba: `v_conductor_front`, `v_control_placas` y `v_vehiculo_front` dependían de esas
  columnas. Se le añadió el DROP/CREATE de esas vistas, ahora seleccionando solo las
  columnas que exponen (sin `co2.*`/`ve.*` expandidos), lo que también las desacopla de
  las columnas que quita 010.
- `registro_acceso` y `celda` no tienen `fecha_creacion` en la BD real aunque la lista
  original las mencionaba.
- El backend no consulta ninguna vista `v_*`; se recrearon por compatibilidad con el
  frontend, no por necesidad de la API.
- Verificado en un Postgres 18 local con el dump restaurado y datos de muestra:
  008→009→010, escrituras auditadas posteriores, 010-down→009-down (restaura datos,
  vistas, funciones y secuencias) y re-aplicación idempotente.
- Tras aplicar en Neon conviene regenerar `database/parku.postgres` con `pg_dump` y
  borrar las tablas `respaldo_009_*` / `respaldo_010_*` cuando ya no hagan falta.
