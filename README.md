# 🎮 GameVault — Tracker de Videojuegos y Gestión de Backlog

**Carrera:** Tecnicatura Universitaria en Desarrollo de Aplicaciones Informáticas (TUDAI)  
**Cátedra:** Taller de Desarrollo de Aplicaciones (TDA)  
**Ciclo Lectivo:** 2026  
**Líderes de Proyecto:** Artusa Juan (Backend Lead) | Gomez Luca (Frontend Lead)  
**Docente Evaluador:** Ing. Gustavo Marcelo Macarone  

---

## 📖 Descripción del Proyecto
GameVault es una plataforma interactiva full stack para la gestión y seguimiento integral de colecciones y bibliotecas de videojuegos personales (backlog). Resuelve activamente la **fatiga de decisión (indecisión del jugador)** mediante un asistente de selección aleatoria ponderada ("Ruleta Gamer"), ofrece bitácoras de juego fechadas por sesión, un catálogo reactivo con portadas y fichas técnicas, y un panel de analíticas estadísticas con cálculo en tiempo real de avance y hábitos de juego.

---

## 🏛️ Arquitectura del Sistema (Fase 3: DAS v2.0)
El sistema implementa una **Arquitectura en 3 Capas Desacoplada**:
1. **Capa de Presentación (Frontend):** Single Page Application (SPA) construida en HTML5 semántico, CSS3 moderno (Dark Gamer Theme estilo Steam) y JavaScript Vanilla (ES6+ modular con Fetch API y Chart.js).
2. **Capa de Lógica de Negocio (Backend REST API):** Servidor Node.js con framework Express.js organizado en Controladores, Servicios, Middlewares y Enrutadores.
3. **Capa de Persistencia (Base de Datos Relacional en 3FN):** Motor relacional con restricciones de integridad foránea (`ON DELETE CASCADE`), índices B-Tree para optimizar latencias por debajo de 2 segundos (RNF-02) y compatibilidad dual SQLite (zero-config local) / MySQL-MariaDB.

---

## 🚀 Puesta en Marcha en Local

### 1. Requisitos Previos
* **Node.js** v20 o superior instalado.
* Navegador web moderno compatible con ES6+.

### 2. Instalación de Dependencias
```bash
cd gamevault
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

### 🔑 Credenciales del Usuario Demo
* **Email:** `gamer@tudai.edu.ar`
* **Contraseña:** `gamer123`

---

## 📋 Matriz de Trazabilidad (Fases 1, 2 y 3 -> Fase 4)

| Historia de Usuario | Requisitos Asociados | Endpoints API REST | Funcionalidad Implementada |
| :--- | :---: | :---: | :--- |
| **HU-01: Registro e Inicio de Sesión** | `RF-01.1`, `RF-01.2`, `RNF-01` | `POST /api/auth/register`<br>`POST /api/auth/login` | Autenticación stateless con JWT, hashing unidireccional bcrypt (10 salt rounds) y protección de rutas. |
| **HU-02: Perfil y Destacados** | `RF-01.3`, `RF-01.4` | `GET /api/auth/profile`<br>`PUT /api/auth/profile` | Datos de perfil, avatar y selección estricta de hasta 4 videojuegos favoritos. |
| **HU-03: Catálogo y Buscador** | `RF-02.1` a `02.3`, `RNF-02` | `GET /api/games`<br>`GET /api/games/filters` | Búsqueda reactiva con debounce (300ms), filtros por género/plataforma y latencia < 2.0s. |
| **HU-04: Gestión de Backlog (CRUD)** | `RF-03.1` a `03.4` | `GET /api/library`<br>`POST /api/library`<br>`PUT /api/library/:id`<br>`DELETE /api/library/:id` | Alta, edición y baja de biblioteca con estados (Pendiente, Jugando, Completado, Abandonado), prioridades y calificación. |
| **HU-05: Bitácora de Sesiones** | `RF-04.1` a `04.4` | `POST /api/sessions`<br>`GET /api/sessions/library/:id` | Diario fechado de sesiones de juego con notas de avance y recálculo automático de horas totales. |
| **HU-06: Dashboard y Estadísticas** | `RF-05.1` a `05.4` | `GET /api/stats/dashboard` | KPIs de juegos totales, porcentaje de backlog completado, horas invertidas y gráficos interactivos Chart.js. |
| **HU-07: Recomendaciones y Ruleta** | `RF-06.1` a `06.3` | `GET /api/stats/random`<br>`GET /api/stats/recommendations` | Selector aleatorio inteligente para mitigar la indecisión y sugerencias por afinidad de género. |

---

## 🌳 Convención de Ramas y Commits (Unidad 4)
* **Branching Strategy:** GitHub Flow (`main`, `develop`, `feature/<funcionalidad>`).
* **Conventional Commits:**
  * `feat: add jwt auth and bcrypt hashing`
  * `fix: correct hours sum in session controller`
  * `docs: update readme with endpoints and credentials`
  * `test: add unit assertions for backlog progress`

