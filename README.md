# 🎮 GameVault — Tracker de Videojuegos y Gestión de Backlog

**Carrera:** Tecnicatura Universitaria en Desarrollo de Aplicaciones Informáticas (TUDAI)  
**Cátedra:** Taller de Desarrollo de Aplicaciones (TDA)  
**Ciclo Lectivo:** 2026  
**Líderes de Proyecto:** Artusa Juan (Backend Lead) | Gomez Luca (Frontend Lead)  
**Docente Evaluador:** Ing. Gustavo Marcelo Macarone  

---

## 📖 Descripción del Proyecto
GameVault es una plataforma interactiva full stack para la gestión, catalogación y seguimiento integral de colecciones personales de videojuegos (*backlog*). Resuelve activamente la **fatiga de decisión (indecisión del jugador)** mediante un asistente de selección aleatoria con ponderación de prioridad ("Ruleta Gamer"), ofrece bitácoras de avance fechadas por sesión, un visor de portadas en alta resolución (Lightbox), un catálogo reactivo con fichas técnicas completas, módulo de listas temáticas personalizadas, reseñas de la comunidad y un **bot asistente de preguntas frecuentes (FAQ)** integrado.

---

## 🏛️ Arquitectura del Sistema (Fase 3: DAS v2.0)
El sistema implementa una **Arquitectura en 3 Capas Desacoplada**:
1. **Capa de Presentación (Frontend SPA):** Single Page Application construida en HTML5 semántico, CSS3 moderno con diseño sobrio (estilo Steam / Linear en paleta pizarra oscura) e iconografía vectorial SVG unificada (libre de emojis informales). Incluye visor Lightbox de portadas, gráficos interactivos con Chart.js y widget de bot de ayuda interactivo.
2. **Capa de Lógica de Negocio (Backend REST API):** Servidor Node.js (v20+) con framework Express.js organizado bajo el patrón Controlador-Modelo-Ruta, protegido con middlewares de autenticación JWT y validación estricta de negocio (ej. tope de 4 favoritos de la HU-02).
3. **Capa de Persistencia (Base de Datos Relacional en 3FN):** Motor relacional normalizado con integridad referencial (`ON DELETE CASCADE`), índices B-Tree de cobertura para optimizar latencias por debajo de 2 segundos (RNF-02) y compatibilidad dual para SQLite (zero-config local) y MySQL/MariaDB (`RANDOM()` / `RAND()`).

---

## 🚀 Puesta en Marcha en Local

### 1. Requisitos Previos
* **Node.js** v20 o superior instalado.
* Navegador web moderno compatible con ES6+.

### 2. Instalación de Dependencias
```bash
npm install
```

### 3. Ejecución del Servidor
```bash
npm start
```
El servidor inicializará automáticamente la base de datos relacional (`database/gamevault.db`), aplicará el esquema DDL (`database/schema.sql`) e insertará los **18 videojuegos iniciales** con sus respectivas carátulas y un usuario gamer demo para pruebas.

### 4. Acceso en el Navegador
Abre tu navegador e ingresa a:  
👉 **`http://localhost:3000`**

### 5. Credenciales de Prueba
* **Email:** `gamer@tudai.edu.ar`
* **Contraseña:** `gamer123`
*(O registrar una cuenta nueva en segundos desde la interfaz)*.

---

## 📋 Matriz de Trazabilidad de Requisitos (Fases 1, 2, 3 -> Fase 4)

| Historia de Usuario | Requisitos Asociados | Endpoints API REST | Funcionalidad Implementada |
| :--- | :---: | :---: | :--- |
| **HU-01: Registro e Inicio de Sesión** | `RF-01.1`, `RF-01.2`, `RNF-01` | `POST /api/auth/register`<br>`POST /api/auth/login` | Autenticación stateless con JWT, hashing unidireccional bcrypt (10 salt rounds) y protección de rutas. |
| **HU-02: Perfil y Tope de 4 Favoritos** | `RF-01.3`, `RF-01.4` | `GET /api/auth/profile`<br>`PUT /api/auth/profile`<br>`PUT /api/library/:id` | Validación estricta en backend: tope de 4 títulos destacados, edición integral de perfil (catálogo de avatares pixel art retro SVG, plataforma, biografía, cambio seguro de contraseña con hash bcrypt y protección 2FA en actualización de correo). |
| **HU-03: Catálogo, Buscador y Lightbox** | `RF-02.1` a `02.3`, `RNF-02` | `GET /api/games`<br>`GET /api/games/filters`<br>`GET /api/games/:id` | Búsqueda reactiva con debounce (300ms), filtros por género/plataforma y visor Lightbox con lupa de ampliación de carátulas en alta resolución. |
| **HU-04: Gestión de Biblioteca y Bitácora** | `RF-03.1` a `03.4`, `RF-04.1` | `GET /api/library`<br>`POST /api/library`<br>`PUT /api/library/:id`<br>`DELETE /api/library/:id`<br>`POST /api/sessions` | CRUD de biblioteca personal por estados (Pendiente, Jugando, Completado, Abandonado), prioridades y registro fechado de horas de juego en bitácora. |
| **HU-05: Listas Temáticas y Reseñas** | `RF-04.2`, `RF-04.3` | `GET/POST /api/lists`<br>`POST/DELETE /api/lists/:id/items`<br>`GET /api/games/:id/reviews` | Creación y administración de colecciones temáticas personalizadas y consulta de opiniones comunitarias con calificaciones por estrellas. |
| **HU-06: Dashboard y Estadísticas** | `RF-05.1` a `05.4` | `GET /api/stats/dashboard` | KPIs de títulos en biblioteca, porcentaje de avance de backlog, horas totales acumuladas y gráficos interactivos con Chart.js. |
| **HU-07: Asistente de Indecisión y Bot FAQ** | `RF-06.1` a `06.3` | `GET /api/stats/random`<br>`GET /api/stats/recommendations` | Selector aleatorio con ponderación de prioridad alta y widget flotante de Bot Asistente con motor de respuestas frecuentes sobre la plataforma. |

---

## 🎨 Sistema de Diseño & UX
* **Línea Gráfica Sobria:** Paleta oscura en tonos pizarra (`#090d16`, `#151e30`) con acento verde esmeralda (`#00dfa2`).
* **Iconografía Vectorial:** Eliminación de emoticones informales; 100% iconos SVG limpios y consistentes.
* **Visor Lightbox:** Lupa interactiva (`🔍+`) en carátulas para previsualizar portada completa y sinopsis.
* **Favicon Institucional:** Joystick verde GameVault disponible en formato `.ico` multirresolución y `.svg`.

---

## 🌳 Convención de Ramas y Commits (Git Flow)
* **Rama Principal:** `main` (código estable listo para entrega).
* **Ramas de Características:** `feature/<funcionalidad>` (integradas mediante Pull Requests).
* **Convención Semántica:**
  * `feat(modulo): nueva funcionalidad asociada a tarea (T-X.Y)`
  * `style(ui): mejoras visuales y rediseño`
  * `fix(api): corrección de bugs o rutas`
  * `test(ci): suite de tests automatizados y pipeline`
