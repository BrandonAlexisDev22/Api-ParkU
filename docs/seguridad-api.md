# Seguridad de la API ParkU

> Documento de apoyo para exposición. Explica **qué** protege la API, **cómo** lo hace y **dónde** está implementado en el código, para poder responder preguntas con el archivo abierto.

---

## 1. Idea general: seguridad en capas

La API no depende de una sola barrera. Una petición pasa por varias capas y cualquiera puede rechazarla:

```
Cliente (frontend en Vercel / app móvil)
   │
   ▼
[1] Headers de seguridad (Helmet)
[2] CORS: ¿desde qué origen viene?
[3] Límite de tamaño del cuerpo (10 MB)
[4] Autenticación: ¿quién eres? (JWT)
[5] Autorización: ¿puedes hacer esto? (roles + permisos)
[6] Validación de datos de entrada
[7] Lógica de negocio (servicios) y base de datos
[8] Manejo de errores sin filtrar información
```

Si una capa falla, las siguientes siguen protegiendo. A esto se le llama **defensa en profundidad**.

---

## 2. Autenticación: JSON Web Tokens (JWT)

**Archivo:** `src/middlewares/auth.middleware.js`

### ¿Cómo funciona el login?

1. El usuario envía correo y contraseña a `POST /api/auth/login`.
2. La API busca el usuario y compara la contraseña con **bcrypt** (ver sección 3).
3. Si es correcta, genera dos tokens firmados con la clave secreta `JWT_SECRET`:
   - **Access token** (7 días por defecto): se envía en cada petición.
   - **Refresh token** (30 días): sirve para pedir un access token nuevo sin volver a escribir la contraseña.
4. El cliente manda el token en cada petición en el header `Authorization: Bearer <token>`.

### ¿Qué lleva dentro el token?

```json
{ "id": 12, "correo": "ana@sena.edu.co", "rol": 2, "pwdTs": 1725000000000 }
```

El token está **firmado**, no cifrado: cualquiera puede leerlo, pero nadie puede modificarlo sin que la firma deje de coincidir. Por eso no se guarda información sensible dentro.

### ¿Qué revisa el middleware `verificarToken` en cada petición?

| Comprobación | Respuesta si falla |
|---|---|
| ¿Viene el token? | `401 Token no proporcionado` |
| ¿La firma es válida y no expiró? | `401 Token inválido` / `Token expirado` |
| ¿El usuario existe y está `ACTIVO` en la BD? | `401 Usuario no encontrado o inactivo` |
| ¿El token se emitió **antes** del último cambio de contraseña? | `401 La contraseña fue cambiada recientemente` |

**Punto fuerte para destacar:** aunque los JWT no se pueden "revocar" por sí solos, la API resuelve dos casos reales:

- **Usuario bloqueado o inactivo:** en cada petición se consulta su estado en la BD, así que un administrador que desactiva una cuenta le corta el acceso al instante, aunque su token siga vigente.
- **Cambio de contraseña:** el token guarda la fecha del último cambio (`pwdTs`). Si la contraseña cambió después de emitir el token, ese token deja de servir. Así, si alguien robó un token, el usuario lo invalida simplemente cambiando su contraseña.

---

## 3. Contraseñas: nunca en texto plano

**Archivo:** `src/utils/password.util.js`

- Se usa **bcrypt** con 10 rondas de *salt* (configurable con `BCRYPT_ROUNDS`).
- bcrypt es un algoritmo **lento a propósito**: cada hash tarda unos milisegundos, lo cual es imperceptible para un usuario pero hace inviable probar millones de contraseñas por segundo si alguien roba la base de datos.
- Cada contraseña tiene su propio *salt* aleatorio: dos usuarios con la misma contraseña tienen hashes distintos, lo que anula las "tablas arcoíris".
- La BD **nunca** guarda la contraseña original; solo el hash. Ni siquiera un administrador puede verla.

### Política de contraseñas (`validarFortaleza`)

Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número. Se aplica en **un solo lugar** para que el registro público y la creación de usuarios por administrador exijan exactamente lo mismo. También se exige confirmación de contraseña antes de crear la cuenta.

---

## 4. Bloqueo por intentos fallidos (fuerza bruta)

**Archivos:** `src/controllers/auth.controller.js`, `src/repositories/usuario.repository.js`

- Cada login fallido incrementa `intentos_fallidos` del usuario.
- Al llegar a **5 intentos**, la cuenta pasa a estado `BLOQUEADO` y no puede entrar aunque acierte la contraseña. Solo un administrador la reactiva.
- Un login correcto reinicia el contador a 0.

Esto frena ataques de adivinación de contraseñas contra una cuenta concreta.

### Mensajes que no dan pistas

Si el correo no existe **o** la contraseña está mal, la respuesta es la misma: `401 Credenciales inválidas`. Así un atacante no puede usar el login para descubrir qué correos están registrados (*enumeración de usuarios*).

Lo mismo ocurre en recuperación de contraseña: `POST /api/auth/recuperar-password` responde igual exista o no la cuenta (`src/services/recuperacionPassword.service.js`).

---

## 5. Autorización: roles y permisos

**Archivos:** `src/middlewares/auth.middleware.js`, `src/config/roles.js`

Autenticar dice *quién eres*; autorizar dice *qué puedes hacer*. La API tiene tres roles del sistema:

| ID | Rol | Ejemplo de lo que hace |
|---|---|---|
| 1 | Administrador | Todo: usuarios, roles, permisos, auditoría |
| 2 | Vigilante | Registrar entradas/salidas, reportar novedades |
| 3 | Conductor | Reservar celdas, gestionar sus vehículos |

### Dos mecanismos combinados

1. **Por rol** (`verificarRol([ROLES.ADMIN])`): la ruta lista los IDs de rol que pueden entrar.
2. **Por permiso** (`verificarPermiso('novedades.gestionar')`): consulta la tabla `rol_permiso` en la BD. Esto permite crear **roles nuevos desde la interfaz** y darles permisos sin tocar código.

`verificarAcceso({ permisos, roles })` combina ambos: autoriza si el rol está en la lista **o** si tiene alguno de los permisos. El Administrador pasa siempre, por definición.

### Detalles de implementación que vale la pena mencionar

- **Caché de permisos (60 s):** la tabla de permisos es pequeña y cambia poco. Se guarda en memoria para no consultar la BD en cada petición, y se **invalida al instante** cuando un administrador edita permisos, para que el cambio aplique de inmediato.
- **Respuesta 403 genérica:** cuando falta un permiso, la API responde `No tienes los permisos requeridos` sin decir *cuál* falta. Enumerar el permiso le diría a un atacante cómo está montado el control de acceso.
- **El registro público ignora el rol enviado:** aunque alguien mande `"rol": 1` al registrarse, siempre nace como Conductor. Nadie puede autoproclamarse administrador.

### Ejemplo real de una ruta protegida

```js
// src/routes/evidenciaNovedad.routes.js
router.delete('/:id',
  verificarToken,                                   // 1. ¿quién eres?
  verificarAcceso({ permisos: ['novedades.gestionar'], roles: [1, 2] }), // 2. ¿puedes?
  ctrl.remove                                       // 3. recién ahí se ejecuta
);
```

---

## 6. Validación de entrada

**Archivos:** `src/middlewares/validators/auth.validator.js`, servicios en `src/services/`

- **express-validator** revisa formato de correo, longitud y fortaleza de contraseña, tipos numéricos, etc., **antes** de que el dato llegue a la lógica de negocio.
- Los servicios vuelven a validar reglas de negocio (por ejemplo, tipos de evidencia permitidos: `FOTO, VIDEO, DOCUMENTO, NOTA`; máximo 3 evidencias por novedad).
- Regla general: **nunca se confía en lo que manda el cliente**.

---

## 7. Protección contra inyección SQL

**Archivos:** `src/repositories/*.js`, `src/config/database.js`

- Todo el acceso a datos pasa por **Sequelize** (ORM). Las consultas se construyen con objetos (`where: { id }`), no concatenando texto.
- Cuando se usa SQL manual, se usan **parámetros** (`replacements: { rol: rolId }`), nunca interpolación de strings. El valor viaja separado de la consulta y la BD no lo interpreta como código.
- La conexión con la base de datos (Neon Postgres) va **cifrada con SSL**.

---

## 8. Subida de archivos segura

**Archivo:** `src/middlewares/upload.middleware.js`

Subir archivos es uno de los puntos más delicados de cualquier API. Lo que se controla:

| Riesgo | Medida |
|---|---|
| Subir un ejecutable disfrazado | Lista blanca de extensiones (`jpg, jpeg, png, webp, mp4, pdf`) y comprobación de que el `Content-Type` coincida con la extensión |
| Archivos enormes que llenen el disco | Límite de tamaño (5 MB perfil, 15 MB evidencias) |
| Sobrescribir archivos o *path traversal* (`../../etc/passwd`) | El nombre original se descarta: cada archivo se guarda como `<UUID aleatorio>.<ext>` en una carpeta fija |
| Borrar archivos fuera de `uploads/` | `eliminarArchivoSiExiste` verifica que la ruta resuelta quede dentro de `uploads/` antes de borrar |
| Subida sin sesión | La ruta exige `verificarToken` |

---

## 9. Headers HTTP y CORS

**Archivo:** `src/index.js`

### Helmet

`app.use(helmet())` añade automáticamente cabeceras que protegen al navegador del usuario:

- `X-Content-Type-Options: nosniff` — evita que el navegador "adivine" tipos de archivo.
- `X-Frame-Options` / `frame-ancestors` — impide que la API se cargue dentro de un iframe ajeno (*clickjacking*).
- `Strict-Transport-Security` — obliga a usar HTTPS.
- `Content-Security-Policy` — limita desde dónde se pueden cargar recursos.
- `Cross-Origin-Resource-Policy: same-origin` — por defecto bloquea que otros orígenes embeban respuestas. Para `/uploads` se relaja a `cross-origin` de forma **explícita y acotada**, porque el frontend vive en otro dominio y necesita mostrar las imágenes.

### CORS

Solo los orígenes de la lista `CORS_ORIGIN` (más el frontend de producción `https://park-u.vercel.app`) pueden llamar a la API desde un navegador. Se restringen también los métodos (`GET, POST, PUT, DELETE, PATCH`) y los headers permitidos (`Content-Type, Authorization`). Un sitio malicioso no puede hacer peticiones con las credenciales del usuario desde su navegador.

### `trust proxy`

La API corre detrás de un proxy (Railway / nginx). `app.set('trust proxy', 1)` hace que lea correctamente la IP real y el protocolo (`https`) desde las cabeceras `X-Forwarded-*`, lo que importa para logs, auditoría y para construir URLs públicas correctas.

---

## 10. Verificación de correo y recuperación de contraseña

**Archivos:** `src/services/verificacionCorreo.service.js`, `src/services/recuperacionPassword.service.js`

- Los tokens de enlace se generan con `crypto.randomBytes(32)` (256 bits de aleatoriedad criptográfica), imposibles de adivinar.
- En la BD **se guarda solo el hash SHA-256 del token**, no el token. Si alguien lee la tabla, no puede usar los enlaces.
- Tienen **caducidad**: enlace de verificación 24 h, código de 6 dígitos 1 h, recuperación de contraseña 1 h.
- El código de 6 dígitos se deriva con **HMAC-SHA256** y se compara con `crypto.timingSafeEqual` (comparación en tiempo constante, que evita ataques de temporización).
- Hay **límite de intentos** por código: tras varios fallos, el código se invalida.
- Al restablecer la contraseña se actualiza `fecha_cambio_contrasena`, lo que **invalida todas las sesiones anteriores** (ver sección 2).

---

## 11. Manejo de errores y logs

**Archivos:** `src/index.js`, `src/helpers/errorHandler.js`, `src/utils/logger.util.js`

- El manejador global de errores responde siempre `500 Error interno del servidor`: **nunca** devuelve el *stack trace* ni detalles internos al cliente. Eso se queda en los logs del servidor.
- Los errores de negocio se devuelven con códigos claros (`400`, `401`, `403`, `404`, `409`) y mensajes controlados.
- Cada petición se registra (método, URL, IP, usuario) en `logs/`, lo que permite investigar incidentes.

---

## 12. Auditoría

**Archivos:** `src/services/auditoria.service.js`, triggers en `database/`

- Los cambios en tablas críticas se registran **desde la propia base de datos** mediante el trigger `fn_auditoria_generica`: quién cambió qué, cuándo, valor anterior y nuevo.
- Al hacerse en la BD y no en la API, el rastro **no puede saltarse** aunque alguien modifique datos por otro camino.
- La consulta de auditoría (`GET /api/auditoria`) es de **solo lectura y solo para administradores**.

---

## 13. Configuración y secretos

- Las claves (`JWT_SECRET`, credenciales de BD, API keys de correo) viven en **variables de entorno** (`.env`), nunca en el código.
- `.env` está en `.gitignore`: no se sube al repositorio. Solo existe `.env.example` con los nombres, sin valores.
- Los archivos subidos por usuarios (`uploads/`) tampoco se versionan.

---

## 14. Resumen para la diapositiva final

| Área | Qué se hace |
|---|---|
| Autenticación | JWT firmado + refresh token; se valida estado del usuario en cada petición |
| Contraseñas | bcrypt con salt; política de fortaleza; confirmación obligatoria |
| Fuerza bruta | Bloqueo tras 5 intentos; mensajes que no revelan si el correo existe |
| Autorización | Roles + permisos dinámicos en BD; el registro público no puede elegir rol |
| Entrada de datos | express-validator + validación de negocio en servicios |
| Base de datos | ORM (Sequelize), consultas parametrizadas, conexión SSL |
| Archivos | Lista blanca de tipos, límite de tamaño, nombres UUID, borrado acotado |
| Navegador | Helmet (CSP, HSTS, nosniff, anti-clickjacking) + CORS restringido |
| Correo / recuperación | Tokens aleatorios hasheados en BD, caducidad, comparación en tiempo constante |
| Errores | Sin *stack traces* al cliente; todo queda en logs |
| Trazabilidad | Auditoría por trigger en BD, solo lectura para administradores |
| Secretos | Variables de entorno, fuera del repositorio |

---

## 15. Mejoras posibles (por si preguntan "¿qué falta?")

Es buena señal en una exposición reconocer límites conocidos:

1. **Rate limiting global** (p. ej. `express-rate-limit`): hoy el bloqueo es por cuenta, no por IP. Un atacante podría probar muchas cuentas distintas.
2. **Revocación de refresh tokens:** son JWT sin estado; no hay "lista negra" ni cierre de sesión en servidor. Se mitiga con el mecanismo de `pwdTs`.
3. **Almacenamiento de archivos externo** (S3, Cloudinary): el disco local funciona en un VPS, pero en plataformas con disco efímero (Railway) los archivos se pierden al redesplegar.
4. **Validación del contenido real del archivo** (leer los *magic bytes*), no solo extensión y `Content-Type`, que los envía el cliente.
5. **Rotación del `JWT_SECRET`** y uso de secretos distintos para access y refresh token.
