# 🎮 GameVault — Tracker de Videojuegos y Gestión de Backlog

**Carrera:** Tecnicatura Universitaria en Desarrollo de Aplicaciones Informáticas (TUDAI)  
**Cátedra:** Taller de Desarrollo de Aplicaciones (TDA)  
**Ciclo Lectivo:** 2026  
**Equipo de Proyecto (Grupo 1):** Artusa Juan (Backend Lead) | Gomez Luca (Frontend Lead)  
**Docente Evaluador:** Ing. Gustavo Marcelo Macarone  

---

## 📖 Descripción del Proyecto
GameVault es una plataforma interactiva full stack para la gestión, catalogación y seguimiento integral de colecciones personales de videojuegos (*backlog*). Resuelve activamente la **fatiga de decisión (indecisión del jugador)** mediante un asistente de selección aleatoria con ponderación de prioridad ("Ruleta Gamer"), ofrece bitácoras de avance fechadas por sesión con consistencia transaccional, un visor de portadas en alta resolución (Lightbox), un catálogo reactivo con fichas técnicas completas, módulo de listas temáticas personalizadas con soporte para edición, panel de administración con control de acceso basado en roles (RBAC), gestión disciplinaria de usuarios y un **bot asistente de preguntas frecuentes (FAQ)** integrado.

---

## 🏛️ Arquitectura del Sistema (Fase 3: DAS v2.0)
El sistema implementa una **Arquitectura en 3 Capas Desacoplada**:
1. **Capa de Presentación (Frontend SPA):** Single Page Application construida en HTML5 semántico, CSS3 moderno con diseño sobrio (estilo Steam / Linear en paleta pizarra oscura) e iconografía vectorial SVG unificada (libre de emojis informales). Incluye panel de administración CRUD, visor Lightbox de portadas, gráficos interactivos con Chart.js y widget de bot de ayuda interactivo.
2. **Capa de Lógica de Negocio (Backend REST API):** Servidor Node.js (v22+) con framework Express.js organizado bajo el patrón Controlador-Modelo-Ruta (`controllers/`, `models/`, `routes/`, `middlewares/`), protegido con middlewares de autenticación JWT, RBAC y validación estricta de negocio (ej. mínimo 8 caracteres de contraseña, tope de 4 favoritos de HU-02).
3. **Capa de Persistencia (Base de Datos Relacional en 3FN):** Motor relacional normalizado con integridad referencial (`ON DELETE CASCADE`), transacciones atómicas (`BEGIN TRANSACTION` / `COMMIT` / `ROLLBACK`), índices B-Tree de cobertura para optimizar latencias por debajo de 2 segundos (RNF-02) y compatibilidad nativa con `node:sqlite` (zero-config local) y MySQL/MariaDB.

---

## 🚀 Puesta en Marcha en Local

### 1. Requisitos Previos
* **Node.js** v22.0.0 o superior instalado (requerido para el módulo nativo `node:sqlite`).
* Navegador web moderno compatible con ECMAScript 2022+.

### 2. Instalación de Dependencias
```bash
npm install
```

### 3. Inicialización de la Base de Datos (Automática y Explícita)
El sistema inicializa el esquema relacional y siembra los datos iniciales automáticamente al ejecutar `npm start`. Adicionalmente, si se desea inicializar o regenerar la base de datos de forma explícita antes del arranque:
```bash
npm run seed
```
Este comando ejecuta `database/schema.sql`, verifica las columnas requeridas, inserta los **18 videojuegos iniciales** del catálogo, y crea de forma independiente las cuentas oficiales de Administrador y Gamer de demostración con sus registros iniciales.

### 4. Variables de Entorno (`.env`)
El proyecto funciona *out-of-the-box* sin requerir configuración manual, pero soporta personalización mediante un archivo `.env` en la raíz:
```env
PORT=3000
DB_CLIENT=sqlite
DB_PATH=./database/gamevault.db
JWT_SECRET=gamevault_super_secret_jwt_key_2026_tudai
```

### 5. Ejecución del Servidor
```bash
npm start
```
El servidor quedará disponible en **`http://localhost:3000`**.

### 6. Credenciales de Prueba Oficiales
* **Cuenta Administrador General:**
  * **Email:** `admin@gamevault.com`
  * **Contraseña:** `admin1234` (9 caracteres)
  * **Rol:** `admin` (Acceso completo al panel administrativo `/api/admin/*`, estadísticas globales, CRUD de catálogo con subida de portadas y gestión disciplinaria de usuarios).

* **Cuenta Usuario Gamer:**
  * **Email:** `gamer@tudai.edu.ar`
  * **Contraseña:** `gamer1234` (9 caracteres)
  * **Rol:** `user` (Biblioteca personal poblada con 8 títulos en diversos estados, 2 sesiones de juego fechadas y 1 lista temática personalizada).

*(También es posible registrar nuevas cuentas desde la interfaz; todas las contraseñas deben contener un mínimo estricto de 8 caracteres).*

---

## 📋 Matriz de Trazabilidad de Requisitos (RF-01 a RF-09 / HU-01 a HU-09)

| Historia de Usuario | Requisito Funcional | Endpoints API REST | Funcionalidad Implementada |
| :--- | :---: | :---: | :--- |
| **HU-01: Registro e Inicio de Sesión** | `RF-01`, `RNF-01` | `POST /api/auth/register`<br>`POST /api/auth/login` | Autenticación stateless con JWT, hashing unidireccional bcrypt (10 salt rounds), validación estricta de contraseña (mínimo 8 caracteres) y protección de rutas. |
| **HU-02: Perfil y Tope de 4 Favoritos** | `RF-02` | `GET /api/auth/profile`<br>`PUT /api/auth/profile`<br>`PUT /api/library/:id` | Validación estricta en backend: tope de 4 títulos destacados, edición integral de perfil (avatares pixel art SVG, plataforma, biografía, cambio seguro de contraseña con verificación de clave actual). |
| **HU-03: Catálogo, Buscador y Lightbox** | `RF-03`, `RNF-02` | `GET /api/games`<br>`GET /api/games/filters`<br>`GET /api/games/:id` | Búsqueda reactiva con debounce (300ms), filtros combinados por género/plataforma y visor Lightbox con ampliación de carátulas. |
| **HU-04: Gestión de Biblioteca (Backlog)** | `RF-04` | `GET /api/library`<br>`POST /api/library`<br>`PUT /api/library/:id`<br>`DELETE /api/library/:id` | CRUD completo de biblioteca personal clasificada por estados (`pending`, `playing`, `completed`, `dropped`), prioridades (`high`, `medium`, `low`), horas y calificación (1 a 5 estrellas). |
| **HU-05: Bitácora y Listas Temáticas** | `RF-05`, `RNF-04` | `POST /api/sessions`<br>`GET /api/sessions/library/:id`<br>`GET /api/sessions/recent`<br>`GET/POST /api/lists`<br>`PUT /api/lists/:id`<br>`DELETE /api/lists/:id`<br>`POST/DELETE /api/lists/:id/items`<br>`GET /api/games/:id/reviews` | Registro fechado de sesiones en bitácora con actualización atómica transaccional (`BEGIN TRANSACTION` / `COMMIT` / `ROLLBACK`) de `hours_played`, CRUD completo de listas temáticas incluyendo edición (`PUT /api/lists/:id`) y consulta de reseñas comunitarias. |
| **HU-06: Dashboard y Estadísticas** | `RF-06` | `GET /api/stats/dashboard` | KPIs de títulos en biblioteca, porcentaje de avance de backlog, horas totales acumuladas y gráficos interactivos con Chart.js. |
| **HU-07: Asistente de Indecisión y Bot FAQ** | `RF-07` | `GET /api/stats/random`<br>`GET /api/stats/recommendations` | Selector aleatorio ("Ruleta Gamer") sobre títulos pendientes con filtro opcional de prioridad alta, recomendaciones por género predominante y Bot Asistente interactivo. |
| **HU-08: Panel Admin y Catálogo (RBAC)** | `RF-08` | `GET /api/admin/stats`<br>`POST /api/admin/games`<br>`PUT /api/admin/games/:id`<br>`DELETE /api/admin/games/:id`<br>`POST /api/admin/upload-cover` | Control de acceso por roles (`role === 'admin'`), métricas globales en tiempo real y CRUD integral del catálogo oficial con subida local de carátulas en base64. |
| **HU-09: Gestión de Usuarios y Moderación** | `RF-09` | `GET /api/admin/users`<br>`POST /api/admin/users`<br>`PUT /api/admin/users/:id`<br>`PUT /api/admin/users/:id/role`<br>`PUT /api/admin/users/:id/status`<br>`DELETE /api/admin/users/:id` | Administración completa de cuentas de usuario, asignación de roles y suspensión disciplinaria (bloqueo de operaciones de escritura `POST/PUT/DELETE` con HTTP 403 manteniendo lectura `GET` para visualizar alerta de suspensión). |

---

## 🛡️ Políticas de Seguridad y Suspensión Disciplinaria
* **Validación de Credenciales:** Mínimo estricto de 8 caracteres exigido en registro, cambio de contraseña y creación/edición administrativa.
* **Manejo Restrictivo de Sesión (Fail-Closed):** Si un token hace referencia a un usuario inexistente o eliminado en la base de datos, `authMiddleware` rechaza la petición con HTTP 401. Ante cualquier error inesperado de base de datos, el middleware responde con HTTP 500 sin permitir el paso de la solicitud.
* **Alcance de la Suspensión Disciplinaria (Baneo):** La suspensión disciplinaria bloquea todas las operaciones mutativas y de escritura en la plataforma (`POST`, `PUT`, `DELETE`), respondiendo con HTTP 403 Forbidden (`banned: true`). Se preserva el acceso de lectura (`GET`) exclusivamente para permitir que el cliente consulte su estado y muestre en la interfaz el banner rojo fijo de cuenta suspendida.

---

## 🧪 Calidad de Software, Tests Automatizados y CI Pipeline

* **Runner Nativo:** Suite implementada con el test runner oficial de Node.js (`node:test` y `node:assert`) operando sobre una base de datos de pruebas aislada (`gamevault_test.db`) que se inicializa desde cero en cada suite.
* **Ejecución Total:** **41 casos de prueba automatizados aprobados (41/41 passing)** distribuidos en **7 suites de pruebas**:
  1. `tests/health.test.js` (2 tests): Verificación de disponibilidad del servicio (`/api/health`) y manejo estricto de rutas API inexistentes con respuestas 404 en JSON.
  2. `tests/auth.test.js` (6 tests): Registro exitoso, autenticación con emisión de JWT, rechazo de credenciales erróneas, rechazo de contraseñas menores a 8 caracteres (6 o 7 chars), aceptación de contraseñas de 8 caracteres exactos y protección de endpoints sin token.
  3. `tests/profile.test.js` (5 tests): Consulta de perfil, actualización de bio/plataforma/avatar, rechazo de cambio de clave ante contraseña actual errónea, rechazo de nueva clave menor a 8 caracteres y regla de negocio HU-02 (tope de 4 favoritos con HTTP 400).
  4. `tests/games.test.js` (5 tests): Consulta del catálogo inicial de 18 videojuegos, filtrado reactivo por título, filtrado por género, obtención de metadatos únicos para filtros y detalle técnico individual.
  5. `tests/lists.test.js` (6 tests): Listado de colecciones, creación de listas temáticas, agregación de ítems, consulta de detalle con videojuegos incluidos, modificación de título y descripción vía `PUT /api/lists/:id` (RF-05 / HU-05) y eliminación segura.
  6. `tests/sessions.test.js` (3 tests): Registro fechado de horas e incremento automático acumulado, consistencia atómica con reversión de transacción (`ROLLBACK`) ante fallos durante la actualización de horas acumuladas, y consulta cronológica de sesiones de juego.
  7. `tests/admin.test.js` (14 tests): Verificación de rol administrativo en login, rechazo HTTP 403 para usuarios estándar en rutas admin, rechazo HTTP 401 para peticiones sin token, listado de usuarios, KPIs globales del sistema, creación de videojuego en catálogo, modificación de videojuego, eliminación de videojuego, subida de portada en base64, creación administrativa de usuario (CRUD), modificación de usuario, aplicación de suspensión disciplinaria con bloqueo HTTP 403 en escritura, desbaneo reactivo y eliminación de usuario.

### Ejecución Local de Pruebas:
```bash
npm test
```
*(Configurado con `--test-concurrency=1` para garantizar ejecución secuencial determinista en SQLite).*
