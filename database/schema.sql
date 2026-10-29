-- ========================================================
-- GameVault Database Schema (DDL) & Initial Seeders
-- Carrera: TUDAI - Taller de Desarrollo de Aplicaciones
-- Arquitectura: Relacional Normalizada (3FN) con Claves Foráneas
-- ========================================================

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT '/assets/avatars/pixel-knight.svg',
    bio VARCHAR(255) DEFAULT 'Gamer en busca de completar su backlog.',
    platform VARCHAR(50) DEFAULT 'PC',
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(150) NOT NULL,
    genre VARCHAR(50) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    release_year INTEGER,
    developer VARCHAR(100),
    synopsis TEXT,
    cover_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, playing, completed, dropped
    priority VARCHAR(10) DEFAULT 'medium', -- high, medium, low
    hours_played DECIMAL(6,2) DEFAULT 0.00,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    is_favorite INTEGER DEFAULT 0, -- 1 si es uno de los 4 destacados (HU-02)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    UNIQUE (user_id, game_id)
);

CREATE TABLE IF NOT EXISTS play_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_library_id INTEGER NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    session_date DATE NOT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_library_id) REFERENCES user_library(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS custom_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS custom_list_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (list_id) REFERENCES custom_lists(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    UNIQUE (list_id, game_id)
);

-- Índices de búsqueda para optimizar RNF-02 (Latencia < 2.0s)
CREATE INDEX IF NOT EXISTS idx_games_title ON games(title);
CREATE INDEX IF NOT EXISTS idx_games_genre ON games(genre);
CREATE INDEX IF NOT EXISTS idx_games_platform ON games(platform);
CREATE INDEX IF NOT EXISTS idx_user_library_user ON user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_status ON user_library(status);
CREATE INDEX IF NOT EXISTS idx_sessions_library ON play_sessions(user_library_id);

