# 🅿️ ParkU API

API REST para la gestión integral de parqueaderos, vehículos, conductores, reservas y control de acceso.

---

## 📋 Descripción

**ParkU API** es un sistema backend desarrollado con **Node.js** y **Express.js** que permite gestionar de manera integral la operación de un sistema de parqueaderos.

El sistema proporciona funcionalidades para:

* 👤 Gestión de usuarios y roles.
* 🚗 Administración de conductores y vehículos.
* 🅿️ Gestión de parqueaderos y celdas.
* 📅 Sistema de reservas.
* 🚪 Registro de ingresos y salidas.
* ⚠️ Gestión y reporte de novedades.
* 📝 Auditoría de acciones realizadas en el sistema.
* 🔐 Autenticación y autorización mediante JWT.

---

## ✨ Características principales

* 🔐 Sistema de autenticación basado en **JWT**.
* 👥 Gestión de roles y permisos.
* 🚗 Administración de vehículos y conductores.
* 🅿️ Gestión de parqueaderos y celdas.
* 📅 Administración de reservas.
* 🚪 Control de entradas y salidas.
* ⚠️ Registro y seguimiento de novedades.
* 📝 Sistema de auditoría.
* 🛡️ Protección mediante Helmet.
* 🚦 Limitación de peticiones mediante Rate Limit.
* 📖 Documentación interactiva con Swagger.
* 📊 Registro de logs del sistema.
* 🐳 Soporte para despliegue con Docker.
* 🚀 Gestión de procesos con PM2.

---

## 🚀 Tecnologías

| Tecnología             | Descripción                                         |
| ---------------------- | --------------------------------------------------- |
| **Node.js**            | Entorno de ejecución para JavaScript en el servidor |
| **Express.js**         | Framework para el desarrollo de la API REST         |
| **PostgreSQL**         | Sistema de gestión de base de datos                 |
| **JWT**                | Autenticación basada en tokens                      |
| **Swagger**            | Documentación interactiva de la API                 |
| **bcrypt**             | Encriptación y protección de contraseñas            |
| **Helmet**             | Protección mediante cabeceras HTTP                  |
| **Morgan**             | Registro de peticiones HTTP                         |
| **express-rate-limit** | Protección contra exceso de peticiones              |

---

## 📋 Requisitos previos

Antes de instalar el proyecto debes tener instalado:

* [Node.js](https://nodejs.org/)
* npm
* PostgreSQL
* Git

Opcionalmente:

* PM2 para producción.
* Docker para despliegue mediante contenedores.
* Postman para realizar pruebas de la API.

---

# 📦 Instalación

## 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/api-parku.git
cd api-parku
```

## 2. Instalar dependencias

```bash
npm install
```

## 3. Configurar variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Después, edita el archivo `.env` con las credenciales correspondientes de tu entorno.

> ⚠️ Nunca subas el archivo `.env` al repositorio. Asegúrate de incluirlo en `.gitignore`.

## 4. Crear la base de datos

Conéctate a PostgreSQL:

```bash
psql -U postgres
```

Crea la base de datos:

```sql
CREATE DATABASE parku;
```

Conéctate a la base de datos:

```sql
\c parku;
```

Ejecuta los scripts SQL:

```sql
\i scripts/01_create_tables.sql
\i scripts/02_insert_initial_data.sql
```

## 5. Iniciar el servidor

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm start
```

---

# 🔐 Variables de entorno

El proyecto utiliza variables de entorno para configurar el servidor, la base de datos, la autenticación y la seguridad.

Ejemplo de configuración:

```env
# =============================================
# PARKU API - CONFIGURACIÓN
# =============================================

# ========== SERVIDOR ==========
PORT=3000
NODE_ENV=development

# ========== BASE DE DATOS ==========
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=parku
DB_POOL_MAX=20
DB_SSL=false

# ========== JWT (AUTENTICACIÓN) ==========
JWT_SECRET=genera_una_clave_segura_aqui
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# ========== BCRYPT (ENCRIPTACIÓN) ==========
BCRYPT_ROUNDS=10

# ========== CORS (DOMINIOS PERMITIDOS) ==========
# Separar múltiples dominios por comas
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# ========== RATE LIMITING ==========
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

# 📡 Endpoints principales

## 🔓 Endpoints públicos

Estos endpoints no requieren autenticación.

| Método | Endpoint                  | Descripción                             |
| ------ | ------------------------- | --------------------------------------- |
| `GET`  | `/`                       | Información general de la API           |
| `GET`  | `/api/health`             | Health check del servidor               |
| `GET`  | `/api/test-db`            | Prueba de conexión con la base de datos |
| `POST` | `/api/auth/login`         | Iniciar sesión                          |
| `POST` | `/api/auth/registro`      | Registrar usuario                       |
| `POST` | `/api/auth/refresh-token` | Renovar token de acceso                 |

---

## 🔒 Endpoints protegidos

Estos endpoints requieren un token JWT válido.

### 🔐 Autenticación

| Método | Endpoint              | Descripción     | Rol   |
| ------ | --------------------- | --------------- | ----- |
| `GET`  | `/api/auth/verificar` | Verificar token | Todos |
| `POST` | `/api/auth/logout`    | Cerrar sesión   | Todos |

### 👤 Usuarios

| Método   | Endpoint                       | Descripción        | Rol         |
| -------- | ------------------------------ | ------------------ | ----------- |
| `GET`    | `/api/usuarios`                | Listar usuarios    | Admin       |
| `GET`    | `/api/usuarios/:id`            | Obtener usuario    | Admin       |
| `POST`   | `/api/usuarios`                | Crear usuario      | Admin       |
| `PUT`    | `/api/usuarios/:id`            | Actualizar usuario | Admin       |
| `DELETE` | `/api/usuarios/:id`            | Eliminar usuario   | Admin       |
| `PATCH`  | `/api/usuarios/:id/contrasena` | Cambiar contraseña | Dueño/Admin |

### 👨‍✈️ Conductores

| Método   | Endpoint               | Descripción          | Rol              |
| -------- | ---------------------- | -------------------- | ---------------- |
| `GET`    | `/api/conductores`     | Listar conductores   | Todos            |
| `GET`    | `/api/conductores/:id` | Obtener conductor    | Todos            |
| `POST`   | `/api/conductores`     | Crear conductor      | Admin/Supervisor |
| `PUT`    | `/api/conductores/:id` | Actualizar conductor | Admin/Supervisor |
| `DELETE` | `/api/conductores/:id` | Eliminar conductor   | Admin            |

### 🚗 Vehículos

| Método   | Endpoint             | Descripción         | Rol              |
| -------- | -------------------- | ------------------- | ---------------- |
| `GET`    | `/api/vehiculos`     | Listar vehículos    | Todos            |
| `GET`    | `/api/vehiculos/:id` | Obtener vehículo    | Todos            |
| `POST`   | `/api/vehiculos`     | Crear vehículo      | Admin/Supervisor |
| `PUT`    | `/api/vehiculos/:id` | Actualizar vehículo | Admin/Supervisor |
| `DELETE` | `/api/vehiculos/:id` | Eliminar vehículo   | Admin            |

### 🅿️ Parqueaderos

| Método   | Endpoint                | Descripción            | Rol   |
| -------- | ----------------------- | ---------------------- | ----- |
| `GET`    | `/api/parqueaderos`     | Listar parqueaderos    | Todos |
| `GET`    | `/api/parqueaderos/:id` | Obtener parqueadero    | Todos |
| `POST`   | `/api/parqueaderos`     | Crear parqueadero      | Admin |
| `PUT`    | `/api/parqueaderos/:id` | Actualizar parqueadero | Admin |
| `DELETE` | `/api/parqueaderos/:id` | Eliminar parqueadero   | Admin |

### 🅿️ Celdas

| Método   | Endpoint          | Descripción      | Rol              |
| -------- | ----------------- | ---------------- | ---------------- |
| `GET`    | `/api/celdas`     | Listar celdas    | Todos            |
| `GET`    | `/api/celdas/:id` | Obtener celda    | Todos            |
| `POST`   | `/api/celdas`     | Crear celda      | Admin/Supervisor |
| `PUT`    | `/api/celdas/:id` | Actualizar celda | Admin/Supervisor |
| `DELETE` | `/api/celdas/:id` | Eliminar celda   | Admin            |

### 📅 Reservas

| Método   | Endpoint            | Descripción        | Rol              |
| -------- | ------------------- | ------------------ | ---------------- |
| `GET`    | `/api/reservas`     | Listar reservas    | Admin/Supervisor |
| `GET`    | `/api/reservas/:id` | Obtener reserva    | Todos            |
| `POST`   | `/api/reservas`     | Crear reserva      | Todos            |
| `PUT`    | `/api/reservas/:id` | Actualizar reserva | Admin/Supervisor |
| `DELETE` | `/api/reservas/:id` | Eliminar reserva   | Admin            |

### 🚪 Ingresos y salidas

| Método   | Endpoint                        | Descripción        | Rol              |
| -------- | ------------------------------- | ------------------ | ---------------- |
| `GET`    | `/api/entradas-salidas`         | Listar movimientos | Admin/Supervisor |
| `POST`   | `/api/entradas-salidas/entrada` | Registrar entrada  | Admin/Supervisor |
| `POST`   | `/api/entradas-salidas/salida`  | Registrar salida   | Admin/Supervisor |
| `DELETE` | `/api/entradas-salidas/:id`     | Eliminar registro  | Admin            |

### ⚠️ Novedades

| Método   | Endpoint             | Descripción        | Rol              |
| -------- | -------------------- | ------------------ | ---------------- |
| `GET`    | `/api/novedades`     | Listar novedades   | Admin/Supervisor |
| `GET`    | `/api/novedades/:id` | Obtener novedad    | Todos            |
| `POST`   | `/api/novedades`     | Crear novedad      | Todos            |
| `PUT`    | `/api/novedades/:id` | Actualizar novedad | Admin/Supervisor |
| `DELETE` | `/api/novedades/:id` | Eliminar novedad   | Admin            |

---

# 👥 Roles y permisos

## Roles

| Rol               | ID | Descripción             |
| ----------------- | -: | ----------------------- |
| **Administrador** |  1 | Acceso total al sistema |
| **Supervisor**    |  2 | Gestión operativa       |
| **Usuario**       |  3 | Acceso básico           |

## Matriz de permisos

| Recurso          | Administrador | Supervisor | Usuario       |
| ---------------- | ------------- | ---------- | ------------- |
| Usuarios         | CRUD          | ❌          | ❌             |
| Roles            | CRUD          | ❌          | ❌             |
| Permisos         | CRUD          | ❌          | ❌             |
| Conductores      | CRUD          | CRUD       | Leer          |
| Vehículos        | CRUD          | CRUD       | Leer          |
| Parqueaderos     | CRUD          | Leer       | Leer          |
| Celdas           | CRUD          | CRUD       | Leer          |
| Reservas         | CRUD          | CRUD       | Crear propias |
| Ingresos/Salidas | CRUD          | CRUD       | ❌             |
| Novedades        | CRUD          | CRUD       | Crear         |

---

# 📊 Diagrama de base de datos

```text
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  permiso ◄── rol_permiso ──► rol ◄── usuario                      │
│                                 │                                   │
│                                 │                                   │
│                    ┌────────────┴────────────┐                      │
│                    │                         │                      │
│                    ▼                         ▼                      │
│                 reserva                  perfil                     │
│                    │                         │                      │
│                    ▼                         ▼                      │
│                 celda ◄── parqueadero    conductor                  │
│                    │                         │                      │
│                    ▼                         │                      │
│              ingreso_salida ────────────────┘                      │
│                    │                                                │
│                    ▼                                                │
│                 novedades                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

# 🛡️ Seguridad

ParkU API implementa diferentes capas de seguridad para proteger la aplicación y controlar el acceso a los recursos.

## Capas de seguridad

* **Helmet:** Protección mediante cabeceras HTTP seguras.
* **CORS:** Control de los dominios permitidos.
* **Rate Limit:** Limitación de peticiones para reducir abusos y ataques.
* **JWT:** Autenticación basada en tokens.
* **Roles y permisos:** Control de autorización granular.
* **bcrypt:** Protección y encriptación de contraseñas.
* **Auditoría:** Registro de acciones realizadas en el sistema.
* **Validación:** Validación de los datos recibidos en las peticiones.

## Flujo de autenticación

```text
1. Usuario envía credenciales
        │
        ▼
2. POST /api/auth/login
        │
        ▼
3. Servidor verifica las credenciales
        │
        ▼
4. Servidor genera JWT y Refresh Token
        │
        ▼
5. Cliente almacena el token
        │
        ▼
6. Cliente envía el token en cada petición
   Authorization: Bearer <token>
        │
        ▼
7. Middleware verificarToken valida el JWT
        │
        ▼
8. Middleware verificarRol/verificarPermiso valida autorización
        │
        ▼
9. Servidor ejecuta la acción solicitada
        │
        ▼
10. Se registra la acción en auditoría
        │
        ▼
11. Servidor devuelve la respuesta
```

---

# 📖 Documentación Swagger

La API cuenta con documentación interactiva mediante Swagger.

Una vez iniciado el servidor, puedes acceder a:

```text
http://localhost:3000/api-docs
```

## Cómo utilizar Swagger

1. Abrir:

```text
http://localhost:3000/api-docs
```

2. Buscar el endpoint:

```text
POST /api/auth/login
```

3. Hacer clic en **Try it out**.

4. Ingresar las credenciales.

5. Hacer clic en **Execute**.

6. Copiar el token obtenido en la respuesta.

7. Hacer clic en **Authorize**.

8. Pegar el token utilizando el formato:

```text
Bearer <TOKEN>
```

9. Probar los endpoints protegidos.

---

#  Estructura del proyecto

```text
api-parku/
│
├── src/
│   │
│   ├── config/
│   │   └── database.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── celda.controller.js
│   │   ├── conductor.controller.js
│   │   ├── entradaSalida.controller.js
│   │   ├── novedades.controller.js
│   │   ├── parqueadero.controller.js
│   │   ├── perfil.controller.js
│   │   ├── permiso.controller.js
│   │   ├── reserva.controller.js
│   │   ├── rol.controller.js
│   │   ├── rolPermiso.controller.js
│   │   ├── usuario.controller.js
│   │   └── vehiculo.controller.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── audit.middleware.js
│   │   └── validation.middleware.js
│   │
│   ├── models/
│   │   ├── usuario.model.js
│   │   ├── perfil.model.js
│   │   ├── conductor.model.js
│   │   ├── vehiculo.model.js
│   │   ├── parqueadero.model.js
│   │   ├── celda.model.js
│   │   ├── reserva.model.js
│   │   ├── entradaSalida.model.js
│   │   ├── novedades.model.js
│   │   ├── rol.model.js
│   │   ├── permiso.model.js
│   │   └── rolPermiso.model.js
│   │
│   ├── repositories/
│   │   ├── usuario.repository.js
│   │   ├── perfil.repository.js
│   │   ├── conductor.repository.js
│   │   ├── vehiculo.repository.js
│   │   ├── parqueadero.repository.js
│   │   ├── celda.repository.js
│   │   ├── reserva.repository.js
│   │   ├── entradaSalida.repository.js
│   │   ├── novedades.repository.js
│   │   ├── rol.repository.js
│   │   ├── permiso.repository.js
│   │   └── rolPermiso.repository.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── celda.routes.js
│   │   ├── conductor.routes.js
│   │   ├── entradaSalida.routes.js
│   │   ├── novedades.routes.js
│   │   ├── parqueadero.routes.js
│   │   ├── perfil.routes.js
│   │   ├── permiso.routes.js
│   │   ├── reserva.routes.js
│   │   ├── rol.routes.js
│   │   ├── rolPermiso.routes.js
│   │   ├── usuario.routes.js
│   │   └── vehiculo.routes.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── celda.service.js
│   │   ├── conductor.service.js
│   │   ├── entradaSalida.service.js
│   │   ├── novedades.service.js
│   │   ├── parqueadero.service.js
│   │   ├── perfil.service.js
│   │   ├── permiso.service.js
│   │   ├── reserva.service.js
│   │   ├── rol.service.js
│   │   ├── rolPermiso.service.js
│   │   ├── usuario.service.js
│   │   └── vehiculo.service.js
│   │
│   ├── utils/
│   │   ├── jwt.util.js
│   │   ├── password.util.js
│   │   └── logger.util.js
│   │
│   └── index.js
│
├── logs/
│   └── YYYY-MM-DD.log
│
├── scripts/
│   ├── 01_create_tables.sql
│   └── 02_insert_initial_data.sql
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── ecosystem.config.js

---

# 🧪 Ejemplos de uso

## 1. Registrar usuario

```bash
curl -X POST http://localhost:3000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "admin@parku.com",
    "contrasena": "Admin123",
    "nombre": "Administrador",
    "rol": 1
  }'
```

---

## 2. Iniciar sesión

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "admin@parku.com",
    "contrasena": "Admin123"
  }'
```

---

## 3. Obtener conductores

Este endpoint requiere autenticación.

```bash
curl -X GET http://localhost:3000/api/conductores \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 4. Crear conductor

```bash
curl -X POST http://localhost:3000/api/conductores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "nombre": "Juan Perez",
    "tipo_documento": "CC",
    "documento": 12345678,
    "perfil": 1
  }'
```

---

## 5. Crear vehículo

```bash
curl -X POST http://localhost:3000/api/vehiculos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "tipo": "CARRO",
    "marca": "Toyota",
    "modelo": "Corolla",
    "placa": "ABC123",
    "color": "Blanco",
    "conductor": 1
  }'
```

---

## 6. Crear reserva

```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "celda": 1,
    "vehiculo_id": 1,
    "fecha_hora_inicio": "2026-07-28T10:00:00",
    "fecha_hora_fin": "2026-07-28T12:00:00"
  }'
```

---

## 7. Registrar entrada

```bash
curl -X POST http://localhost:3000/api/entradas-salidas/entrada \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "vehiculo": 1,
    "celda": 1,
    "descripcion": "Ingreso por portería principal"
  }'
```

---

## 8. Crear novedad

```bash
curl -X POST http://localhost:3000/api/novedades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "vehiculo": 1,
    "descripcion": "Vehículo estacionado en zona prohibida",
    "tipo_novedad": "MAL_ESTACIONAMIENTO",
    "prioridad": "ALTA"
  }'
```

---

# 📝 Logs y auditoría

## Estructura de logs

Los logs se almacenan en:

```text
logs/YYYY-MM-DD.log
```

Ejemplo:

```json
{"timestamp":"2026-07-27T18:30:00.000Z","level":"INFO","message":"Servidor iniciado correctamente"}
{"timestamp":"2026-07-27T18:31:00.000Z","level":"AUDIT","message":"Usuario 1: LOGIN_EXITOSO","data":{"correo":"admin@parku.com","ip":"::1"}}
{"timestamp":"2026-07-27T18:32:00.000Z","level":"ERROR","message":"Error al crear usuario","data":{"error":"Duplicate entry"}}
```

## Ver logs

### Ver logs del día

```bash
cat logs/$(date +%Y-%m-%d).log
```

### Ver solo errores

```bash
grep ERROR logs/$(date +%Y-%m-%d).log
```

### Ver registros de auditoría

```bash
grep AUDIT logs/$(date +%Y-%m-%d).log
```

### Ver logs en tiempo real

```bash
tail -f logs/$(date +%Y-%m-%d).log
```

---

# 🚀 Despliegue

## Con PM2

Instalar PM2:

```bash
npm install -g pm2
```

Iniciar la aplicación:

```bash
pm2 start ecosystem.config.js
```

Ver el estado:

```bash
pm2 status
```

Ver logs:

```bash
pm2 logs parku-api
```

Reiniciar:

```bash
pm2 restart parku-api
```

Detener:

```bash
pm2 stop parku-api
```

---

## Con Docker

Ejemplo de `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

Construir la imagen:

```bash
docker build -t parku-api .
```

Ejecutar el contenedor:

```bash
docker run -p 3000:3000 --env-file .env parku-api
```

---

# 🧪 Pruebas rápidas

## Health check

```bash
curl http://localhost:3000/api/health
```

## Comprobar conexión con la base de datos

```bash
curl http://localhost:3000/api/test-db
```

## Obtener información general de la API

```bash
curl http://localhost:3000/
```

---

# ❓ Preguntas frecuentes

## ¿Cómo genero un JWT_SECRET?

Puedes generar una clave segura utilizando Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## ¿Cómo reinicio la base de datos?

Puedes eliminar y recrear el esquema público:

```bash
psql -U postgres -d parku -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

Después ejecuta nuevamente los scripts:

```bash
psql -U postgres -d parku -f scripts/01_create_tables.sql

psql -U postgres -d parku -f scripts/02_insert_initial_data.sql
```

> ⚠️ Este procedimiento elimina los datos existentes de la base de datos. Utilízalo únicamente en entornos de desarrollo o cuando tengas un respaldo.

---

## ¿Cómo veo los logs en producción?

Con PM2:

```bash
pm2 logs parku-api --lines 100
```

---

## ¿Qué hago si el puerto 3000 está ocupado?

En Windows puedes buscar el proceso que está utilizando el puerto:

```bash
netstat -ano | findstr :3000
```

Después puedes finalizar el proceso:

```bash
taskkill /PID <PID> /F
```

---

## ¿Cómo pruebo la API desde Postman?

1. Importa la colección de Postman.
2. Configura la variable:

```text
baseUrl = http://localhost:3000
```

3. Realiza el login.
4. Obtén el token JWT.
5. Configura el token para las solicitudes protegidas.
6. Realiza las pruebas de los diferentes endpoints.

---

# 📄 Licencia

Este proyecto está bajo la licencia **ISC**.

---

# 👨‍💻 Autor

**Anderson**

Desarrollador de Software

---

# 🤝 Contribuciones

Las contribuciones son bienvenidas.

Para contribuir:

1. Realiza un fork del repositorio.

2. Crea una rama para tu nueva funcionalidad:

```bash
git checkout -b feature/nueva-funcionalidad
```

3. Realiza tus cambios.

4. Crea un commit:

```bash
git commit -m "Agrega nueva funcionalidad"
```

5. Envía los cambios:

```bash
git push origin feature/nueva-funcionalidad
```

6. Abre un **Pull Request**.

---

# 📞 Contacto

* **Email:** [anderson@parku.com](mailto:anderson@parku.com)
* **GitHub:** tu-usuario

---

# 🙏 Agradecimientos

* [Node.js](https://nodejs.org/)
* [Express.js](https://expressjs.com/)
* [PostgreSQL](https://www.postgresql.org/)
* Todos los contribuyentes del proyecto.

---

<p align="center">
  🅿️ <strong>ParkU API</strong>
  <br>
  Sistema de gestión integral de parqueaderos
</p>
