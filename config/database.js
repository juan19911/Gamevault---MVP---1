const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const DB_CLIENT = process.env.DB_CLIENT || 'sqlite';
let dbInstance = null;

// Unified Promise-based DB interface
const db = {
    async query(sql, params = []) {
        if (!dbInstance) {
            await initDatabase();
        }

        if (DB_CLIENT === 'sqlite') {
            try {
                const trimmed = sql.trim();
                const isSelect = /^SELECT/i.test(trimmed) || /^PRAGMA/i.test(trimmed);

                // Convert MySQL-specific syntax to SQLite compatible if any
                let sqliteSql = trimmed
                    .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
                    .replace(/ENGINE=InnoDB/gi, '')
                    .replace(/CHARACTER SET [^ ;]+/gi, '')
                    .replace(/COLLATE [^ ;]+/gi, '');

                if (isSelect) {
                    const stmt = dbInstance.prepare(sqliteSql);
                    const rows = stmt.all(...params);
                    return [rows];
                } else {
                    const stmt = dbInstance.prepare(sqliteSql);
                    const info = stmt.run(...params);
                    return [{
                        insertId: Number(info.lastInsertRowid),
                        affectedRows: info.changes
                    }];
                }
            } catch (err) {
                console.error('Database Query Error:', err.message, '\nSQL:', sql);
                throw err;
            }
        } else {
            // MySQL2 connection pool
            return await dbInstance.execute(sql, params);
        }
    }
};

async function initDatabase() {
    if (dbInstance) return dbInstance;

    if (DB_CLIENT === 'sqlite') {
        const { DatabaseSync } = require('node:sqlite');
        const dbPath = path.resolve(process.env.DB_PATH || './database/gamevault.db');
        const dbDir = path.dirname(dbPath);

        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        dbInstance = new DatabaseSync(dbPath);
        dbInstance.exec('PRAGMA foreign_keys = ON;');
        dbInstance.exec('PRAGMA journal_mode = WAL;');
        dbInstance.exec('PRAGMA busy_timeout = 5000;');

        // Run schema
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
            dbInstance.exec(schemaSql);
        }

        // Seed initial games and test user
        await seedInitialData();

        console.log(`[Database] SQLite conectado exitosamente en: ${dbPath}`);
        return dbInstance;
    } else {
        const mysql = require('mysql2/promise');
        dbInstance = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'gamevault_db',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        console.log(`[Database] Pool MySQL conectado en ${process.env.DB_HOST}:${process.env.DB_PORT}`);
        return dbInstance;
    }
}

async function seedInitialData() {
    // Ensure role and status columns exist (safe migration)
    try {
        const [cols] = await db.query("PRAGMA table_info(users)");
        const colNames = Array.isArray(cols) ? cols.map(c => c.name) : [];
        if (!colNames.includes('role')) {
            await db.query("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'");
        }
        if (!colNames.includes('status')) {
            await db.query("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'");
        }
    } catch (e) {
        // Safe fallback for MySQL or other drivers
    }

    // 1. Check if games table is empty and seed initial 18 games
    const [existingGames] = await db.query('SELECT COUNT(*) as count FROM games');
    const count = existingGames[0]?.count || 0;

    if (count === 0) {
        console.log('[Database] Insertando 18 videojuegos iniciales en el catálogo...');

        const initialGames = [
            {
                title: 'Age of Empires II: Definitive Edition',
                genre: 'Estrategia',
                platform: 'PC',
                release_year: 2019,
                developer: 'Forgotten Empires',
                synopsis: 'Clásico imperecedero de estrategia en tiempo real remasterizado en 4K con nuevas civilizaciones y campañas.',
                cover_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600'
            },
            {
                title: 'Portal 2',
                genre: 'Puzzle',
                platform: 'PC',
                release_year: 2011,
                developer: 'Valve Corporation',
                synopsis: 'Ingenioso juego de lógica en primera persona con la pistola de portales y el humor sarcástico de GLaDOS y Wheatley.',
                cover_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600'
            },
            {
                title: 'Counter-Strike 2',
                genre: 'Shooter',
                platform: 'PC',
                release_year: 2023,
                developer: 'Valve Corporation',
                synopsis: 'El shooter táctico por excelencia impulsado por Source 2 con humo volumétrico reactivo y tickrate dinámico.',
                cover_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600'
            },
            {
                title: 'The Witcher 3: Wild Hunt',
                genre: 'RPG',
                platform: 'Multiplataforma',
                release_year: 2015,
                developer: 'CD Projekt RED',
                synopsis: 'Geralt de Rivia emprende la búsqueda de Ciri en un continente asolado por la guerra y la Cacería Salvaje.',
                cover_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600'
            },
            {
                title: 'Elden Ring',
                genre: 'RPG',
                platform: 'Multiplataforma',
                release_year: 2022,
                developer: 'FromSoftware',
                synopsis: 'Aventura de rol y acción en las Tierras Intermedias nacida de la colaboración entre Miyazaki y George R.R. Martin.',
                cover_url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600'
            },
            {
                title: 'Hollow Knight',
                genre: 'Metroidvania',
                platform: 'Multiplataforma',
                release_year: 2017,
                developer: 'Team Cherry',
                synopsis: 'Desciende a las profundidades de Hallownest en este desafiante y bello juego de plataformas 2D dibujado a mano.',
                cover_url: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=600'
            },
            {
                title: 'Half-Life 2',
                genre: 'Shooter',
                platform: 'PC',
                release_year: 2004,
                developer: 'Valve Corporation',
                synopsis: 'Gordon Freeman lidera la resistencia contra la Alianza alienígena en Ciudad 17 con la legendaria pistola de gravedad.',
                cover_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600'
            },
            {
                title: 'Civilization VI',
                genre: 'Estrategia',
                platform: 'Multiplataforma',
                release_year: 2016,
                developer: 'Firaxis Games',
                synopsis: 'Construye un imperio que resista el paso del tiempo expandiendo ciudades físicamente a través del mapa.',
                cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600'
            },
            {
                title: 'DOOM Eternal',
                genre: 'Shooter',
                platform: 'Multiplataforma',
                release_year: 2020,
                developer: 'id Software',
                synopsis: 'Conviértete en el Slayer en una frenética danza de combate contra hordas demoníacas con banda sonora atronadora.',
                cover_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600'
            },
            {
                title: 'Hades',
                genre: 'Roguelike',
                platform: 'Multiplataforma',
                release_year: 2020,
                developer: 'Supergiant Games',
                synopsis: 'Zagreus intenta escapar del inframundo de su padre con la ayuda de los dioses del Olimpo en un hack-and-slash sublime.',
                cover_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600'
            },
            {
                title: 'Cyberpunk 2077',
                genre: 'RPG',
                platform: 'Multiplataforma',
                release_year: 2020,
                developer: 'CD Projekt RED',
                synopsis: 'Explora la megalópolis futurista de Night City como el mercenario V buscando un implante que otorga la inmortalidad.',
                cover_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600'
            },
            {
                title: 'Celeste',
                genre: 'Plataformas',
                platform: 'Multiplataforma',
                release_year: 2018,
                developer: 'Maddy Makes Games',
                synopsis: 'Ayuda a Madeline a escalar la Montaña Celeste mientras enfrenta sus demonios internos en un plataformero de precisión conmovedor.',
                cover_url: 'https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?w=600'
            },
            {
                title: 'Red Dead Redemption 2',
                genre: 'Accion',
                platform: 'Multiplataforma',
                release_year: 2018,
                developer: 'Rockstar Games',
                synopsis: 'Arthur Morgan y la banda de Van der Linde huyen a través de una América en el ocaso de la era del Salvaje Oeste.',
                cover_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600'
            },
            {
                title: 'BioShock',
                genre: 'Shooter',
                platform: 'Multiplataforma',
                release_year: 2007,
                developer: 'Irrational Games',
                synopsis: 'Sumérgete en la decadente utopía submarina de Rapture modificando tu ADN con plásmidos.',
                cover_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600'
            },
            {
                title: 'StarCraft II',
                genre: 'Estrategia',
                platform: 'PC',
                release_year: 2010,
                developer: 'Blizzard Entertainment',
                synopsis: 'La cúspide de los RTS intergalácticos con la guerra milenaria entre Terran, Zerg y Protoss.',
                cover_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600'
            },
            {
                title: 'Stardew Valley',
                genre: 'Simulacion',
                platform: 'Multiplataforma',
                release_year: 2016,
                developer: 'ConcernedApe',
                synopsis: 'Hereda la vieja granja de tu abuelo y transforma un campo descuidado en un próspero hogar campestre.',
                cover_url: 'https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?w=600'
            },
            {
                title: 'Terraria',
                genre: 'Aventura',
                platform: 'Multiplataforma',
                release_year: 2011,
                developer: 'Re-Logic',
                synopsis: 'Excava, lucha, explora y construye en un vasto mundo generado por procedimientos repleto de monstruos y tesoros.',
                cover_url: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=600'
            },
            {
                title: 'God of War (2018)',
                genre: 'Accion',
                platform: 'Multiplataforma',
                release_year: 2018,
                developer: 'Santa Monica Studio',
                synopsis: 'Kratos vive ahora en el reino de los dioses y monstruos nórdicos, guiando a su hijo Atreus mientras domina su furia.',
                cover_url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600'
            }
        ];

        for (const g of initialGames) {
            await db.query(
                `INSERT INTO games (title, genre, platform, release_year, developer, synopsis, cover_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [g.title, g.genre, g.platform, g.release_year, g.developer, g.synopsis, g.cover_url]
            );
        }
    }

    // 2. Ensure Administrator account exists independently (admin@gamevault.com / admin1234)
    try {
        const [adminCheck] = await db.query("SELECT id FROM users WHERE email = 'admin@gamevault.com' LIMIT 1");
        if (!adminCheck || adminCheck.length === 0) {
            console.log('[Database] Inicializando cuenta de administrador oficial (admin@gamevault.com)...');
            const adminHash = await bcrypt.hash('admin1234', 10);
            await db.query(
                `INSERT INTO users (username, email, password_hash, avatar, bio, platform, role, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                ['admin', 'admin@gamevault.com', adminHash, '/assets/avatars/pixel-marine.svg', 'Administrador General de la Plataforma GameVault.', 'PC Master Race', 'admin', 'active']
            );
        }
    } catch (e) {
        console.error('[Database] Warning verificando admin:', e.message);
    }

    // 3. Ensure Gamer demo account exists independently (gamer@tudai.edu.ar / gamer1234)
    try {
        const [gamerCheck] = await db.query("SELECT id FROM users WHERE email = 'gamer@tudai.edu.ar' LIMIT 1");
        if (!gamerCheck || gamerCheck.length === 0) {
            console.log('[Database] Creando usuario gamer de prueba (gamer@tudai.edu.ar)...');
            // gamer1234 has 9 characters (meets >= 8 chars requirement)
            const passwordHash = await bcrypt.hash('gamer1234', 10);
            const [res] = await db.query(
                `INSERT INTO users (username, email, password_hash, avatar, bio, platform, role, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                ['juan_luca', 'gamer@tudai.edu.ar', passwordHash, '/assets/avatars/retro-cyber.svg', 'Estudiante TUDAI - Jugando clásicos y completando el backlog.', 'PC Master Race', 'user', 'active']
            );
            const demoUserId = res.insertId;

            // Add sample games to user library with varied statuses and ratings
            await db.query(
                `INSERT INTO user_library (user_id, game_id, status, priority, hours_played, rating, review, is_favorite)
                 VALUES 
                 (?, 1, 'playing', 'high', 45.5, 5, 'Joya inmortal de la estrategia.', 1),
                 (?, 13, 'playing', 'high', 110.0, 5, 'Obra maestra absoluta de Rockstar.', 1),
                 (?, 14, 'completed', 'medium', 22.0, 5, 'Increíble atmósfera y jugabilidad.', 1),
                 (?, 7, 'completed', 'high', 15.0, 5, 'Revolucionario en físicas y narrativa.', 1),
                 (?, 3, 'playing', 'medium', 85.0, 4, 'Competitivo adictivo con amigos.', 0),
                 (?, 9, 'dropped', 'low', 12.0, 2, 'Mucha toxicidad en las partidas clasificatorias.', 0),
                 (?, 16, 'pending', 'high', 0.0, NULL, NULL, 0),
                 (?, 17, 'pending', 'medium', 0.0, NULL, NULL, 0)`,
                [demoUserId, demoUserId, demoUserId, demoUserId, demoUserId, demoUserId, demoUserId, demoUserId]
            );

            // Add 2 play sessions
            await db.query(
                `INSERT INTO play_sessions (user_library_id, hours, session_date, notes)
                 VALUES 
                 (1, 3.5, '2026-10-15', 'Campaña de Juana de Arco completada'),
                 (2, 5.0, '2026-10-16', 'Caza legendaria y misiones del Capítulo 3')`
            );
        }
    } catch (e) {
        console.error('[Database] Warning verificando gamer demo:', e.message);
    }
}

module.exports = {
    db,
    initDatabase
};
