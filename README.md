# 🎮 GameVault — Tracker de Videojuegos y Gestión de Backlog

**Carrera:** Tecnicatura Universitaria en Desarrollo de Aplicaciones Informáticas (TUDAI)  
**Cátedra:** Taller de Desarrollo de Aplicaciones (TDA)  
**Ciclo Lectivo:** 2026  
**Equipo de Proyecto (Grupo 1):** Artusa Juan (Backend Lead) | Gomez Luca (Frontend Lead)  
**Docente Evaluador:** Ing. Gustavo Marcelo Macarone  

---

## 📖 Descripción del Proyecto
GameVault es una plataforma interactiva full stack para la gestión, catalogación y seguimiento integral de colecciones personales de videojuegos (*backlog*). Resuelve activamente la **fatiga de decisión (indecisión del jugador)** mediante un asistente de selección aleatoria con ponderación de prioridad ("Ruleta Gamer"), ofrece bitácoras de avance fechadas por sesión con consistencia transaccional, un visor de portadas en alta resolución (Lightbox), un catálogo reactivo con fichas técnicas completas, módulo de listas temáticas personalizadas con soporte para edición y ordenamiento, panel de administración con control de acceso basado en roles (RBAC), gestión disciplinaria de usuarios y un **bot asistente de preguntas frecuentes (FAQ)** integrado.

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

### 3. Inicialización de la Base de Datos (Opcional / Explícita)
El sistema inicializa y siembra automáticamente la base de datos al arrancar el servidor. Si se desea ejecutar la inicialización de forma explícita:
```bash
npm run seed
```
Este comando crea las tablas relacionales (`database/schema.sql`), asegura la existencia de las columnas requeridas, inserta los **18 videojuegos iniciales** del catálogo, y genera independientemente las cuentas oficiales de Administrador y Gamer de demostración con sus datos de prueba asociados.

### 4. Ejecución del Servidor
```bash
npm start
```
El servidor quedará disponible en el puerto 3000 (o el definido en `.env`).

### 5. Acceso en el Navegador
Abre tu navegador e ingresa a:  
👉 **`http://localhost:3000`**

### 6. Credenciales de Prueba Oficiales
* **Cuenta Administrador General:**
  * **Email:** `admin@gamevault.com`
  * **Contraseña:** `admin1234` (9 caracteres)
  * **Rol:** `admin` (Acceso completo al panel administrativo `/api/admin/*`, estadísticas globales, CRUD de catálogo con subida de portadas y gestión disciplinaria de usuarios).

* **Cuenta Usuario Gamer:**
  * **Email:** `gamer@tudai.edu.ar`
  * **Contraseña:** `gamer1234` (9 caracteres)
  * **Rol:** `user` (Biblioteca personal poblada con 8 títulos en diversos estados, 2 sesiones de juego fechadas y listas personalizadas).

*(También es posible registrar nuevas cuentas desde la interfaz; todas las contraseñas deben contener al menos 8 caracteres).*

---

## 📋 Matriz de Trazabilidad de Requisitos

| Historia de Usuario | Requisitos Asociados | Endpoints API REST | Funcionalidad Implementada |
| :--- | :---: | :---: | :--- |
| **HU-01: Registro e Inicio de Sesión** | `RF-01.1`, `RF-01.2`, `RNF-01` | `POST /api/auth/register`<br>`POST /api/auth/login` | Autenticación stateless con JWT, hashing unidireccional bcrypt (10 salt rounds), validación estricta de contraseña (mínimo 8 caracteres) y protección de rutas. |
| **HU-02: Perfil y Tope de 4 Favoritos** | `RF-01.3`, `RF-01.4` | `GET /api/auth/profile`<br>`PUT /api/auth/profile`<br>`PUT /api/library/:id` | Validación estricta en backend: tope de 4 títulos destacados, edición integral de perfil (avatares pixel art SVG, plataforma, biografía, cambio seguro de contraseña con verificación de clave actual). |
| **HU-03: Catálogo, Buscador y Lightbox** | `RF-02.1` a `02.3`, `RNF-02` | `GET /api/games`<br>`GET /api/games/filters`<br>`GET /api/games/:id` | Búsqueda reactiva con debounce (300ms), filtros por género/plataforma y visor Lightbox con ampliación de carátulas en alta resolución. |
| **HU-04: Gestión de Biblioteca y Bitácora** | `RF-03.1` a `03.4`, `RF-04.1` | `GET /api/library`<br>`POST /api/library`<br>`PUT /api/library/:id`<br>`DELETE /api/library/:id`<br>`POST /api/sessions`<br>`GET /api/sessions/library/:id` | CRUD de biblioteca personal por estados (Pendiente, Jugando, Completado, Abandonado), prioridades y registro fechado de horas de juego en bitácora con consistencia atómica transaccional (`BEGIN TRANSACTION` / `COMMIT` / `ROLLBACK`). |
| **HU-05: Listas Temáticas y Reseñas** | `RF-04.2`, `RF-04.3`, `RF-09` | `GET/POST /api/lists`<br>`PUT /api/lists/:id`<br>`DELETE /api/lists/:id`<br>`POST/DELETE /api/lists/:id/items`<br>`GET /api/games/:id/reviews` | Creación, edición (`PUT /api/lists/:id`) y administración de colecciones temáticas personalizadas y consulta de opiniones comunitarias. |
| **HU-06: Dashboard y Estadísticas** | `RF-05.1` a `05.4` | `GET /api/stats/dashboard` | KPIs de títulos en biblioteca, porcentaje de avance de backlog, horas totales acumuladas y gráficos interactivos con Chart.js. |
| **HU-07: Asistente de Indecisión y Bot FAQ** | `RF-06.1` a `06.3` | `GET /api/stats/random`<br>`GET /api/stats/recommendations` | Selector aleatorio con ponderación de prioridad alta y widget flotante de Bot Asistente con motor de respuestas frecuentes sobre la plataforma. |
| **HU-08: Panel de Administración y RBAC** | `RF-07.1` a `RF-07.4`, `RF-08` | `GET /api/admin/users`<br>`POST /api/admin/users`<br>`PUT /api/admin/users/:id`<br>`PUT /api/admin/users/:id/status`<br>`DELETE /api/admin/users/:id`<br>`POST/PUT/DELETE /api/admin/games`<br>`POST /api/admin/upload-cover`<br>`GET /api/admin/stats` | Control de acceso por roles (RBAC) con middleware restrictivo, CRUD integral de catálogo con subida de imágenes de portada locales, CRUD de usuarios y suspensión disciplinaria. |

---

## 🛡️ Políticas de Seguridad y Suspensión Disciplinaria
* **Validación de Credenciales:** Mínimo estricto de 8 caracteres exigido en registro, cambio de contraseña y creación administrativa.
* **Manejo Restrictivo de Sesión (Fail-Closed):** Si un token hace referencia a un usuario inexistente o eliminado, `authMiddleware` revoca la sesión inmediatamente con HTTP 401. Ante cualquier fallo inesperado de base de datos, el middleware responde con HTTP 500 y no permite el paso de la petición.
* **Alcance de la Suspensión Disciplinaria (Baneo):** La suspensión disciplinaria bloquea todas las operaciones mutativas y de interacción en la plataforma (`POST`, `PUT`, `DELETE`), respondiendo con HTTP 403 Forbidden (`banned: true`). Se preserva el acceso de solo lectura (`GET`) exclusivamente para permitir que el cliente consulte su estado y visualice en la interfaz el banner de advertencia rojo indicando la suspensión de su cuenta.

---

## 🧪 Calidad de Software, Tests Automatizados y CI Pipeline

* **Runner Nativo:** Suite implementada con el test runner estándar de Node.js (`node:test` y `node:assert`).
* **Cobertura Total:** **41 pruebas automatizadas** distribuidas en **7 suites principales**, todas ejecutables de manera secuencial y determinista:
  1. `tests/health.test.js` (2 tests): Verificación de disponibilidad del servicio (`/api/health`) y manejo estricto de rutas inexistentes con respuestas 404 estructuradas en JSON.
  2. `tests/auth.test.js` (6 tests): Registro exitoso, autenticación con emisión de JWT, rechazo de credenciales erróneas, rechazo de contraseñas menores a 8 caracteres (6 o 7 chars), aceptación de contraseñas de 8 caracteres exactos y protección de endpoints sin token.
  3. `tests/profile.test.js` (5 tests): Consulta de perfil, actualización de bio/plataforma/avatar, rechazo de cambio de clave ante contraseña actual errónea, rechazo de nueva clave menor a 8 caracteres y regla de negocio HU-02 (tope de 4 favoritos con HTTP 400).
  4. `tests/games.test.js` (5 tests): Consulta del catálogo inicial de 18 videojuegos, filtrado reactivo por título, filtrado por género, obtención de metadatos únicos para filtros y detalle técnico individual.
  5. `tests/lists.test.js` (6 tests): Listado de colecciones, creación de listas temáticas, agregación de ítems, consulta de detalle con videojuegos incluidos, modificación de título y descripción vía `PUT /api/lists/:id` (RF-09) y eliminación segura.
  6. `tests/sessions.test.js` (3 tests): Registro fechado de horas e incremento automático acumulado, consistencia atómica con reversión de transacción (`ROLLBACK`) ante fallos de integridad referencial, y consulta cronológica de sesiones de juego.
  7. `tests/admin.test.js` (14 tests): Verificación de rol administrativo en login, rechazo HTTP 403 para usuarios estándar en rutas admin, rechazo HTTP 401 para peticiones sin token, listado de usuarios, KPIs globales del sistema, creación de videojuego en catálogo, modificación de videojuego, eliminación de videojuego, subida de portada en base64, creación administrativa de usuario (CRUD), modificación de usuario, aplicación de suspensión disciplinaria con bloqueo HTTP 403, desbaneo reactivo y eliminación de usuario.

### Ejecución Local de Pruebas:
```bash
npm test
```
*(Configurado con `--test-concurrency=1` para garantizar ejecución libre de bloqueos en SQLite).*
