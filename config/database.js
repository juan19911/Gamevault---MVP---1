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

        // Seed initial games and demo/admin accounts
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

    // 1. Check if games table is empty and seed 18 initial games
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
                synopsis: 'El clásico juego de estrategia en tiempo real remasterizado con gráficos 4K y nuevas civilizaciones.',
                cover_url: '/assets/covers/age of empires 2.jpg'
            },
            {
                title: 'Colin McRae: DiRT',
                genre: 'Carreras',
                platform: 'PC / PS3 / Xbox 360',
                release_year: 2007,
                developer: 'Codemasters',
                synopsis: 'Emocionantes carreras todoterreno y rallies con físicas realistas y circuitos mundiales.',
                cover_url: '/assets/covers/collin mc rae dirt.jpg'
            },
            {
                title: 'Counter-Strike 2',
                genre: 'Shooter',
                platform: 'PC',
                release_year: 2023,
                developer: 'Valve',
                synopsis: 'La cúspide de los shooters tácticos competitivos basada en el motor Source 2 con humo volumétrico.',
                cover_url: '/assets/covers/cs2.webp'
            },
            {
                title: 'Devil May Cry 4',
                genre: 'Acción',
                platform: 'PC / PS3 / Xbox 360',
                release_year: 2008,
                developer: 'Capcom',
                synopsis: 'Frenético hack and slash protagonizado por Nero y Dante con combos espectaculares y enemigos demoníacos.',
                cover_url: '/assets/covers/devil may cry 4.webp'
            },
            {
                title: 'Far Cry',
                genre: 'Shooter',
                platform: 'PC',
                release_year: 2004,
                developer: 'Crytek',
                synopsis: 'Jack Carver se enfrenta a mercenarios y mutantes en un archipiélago tropical con total libertad táctica.',
                cover_url: '/assets/covers/farcry.jpg'
            },
            {
                title: 'Guitar Hero III: Legends of Rock',
                genre: 'Música',
                platform: 'Multiplataforma',
                release_year: 2007,
                developer: 'Neversoft',
                synopsis: 'Toca los riffs más legendarios del rock and roll con duelos de guitarras contra Slash y Tom Morello.',
                cover_url: '/assets/covers/guitar hero.jpg'
            },
            {
                title: 'Half-Life 2',
                genre: 'Shooter',
                platform: 'PC',
                release_year: 2004,
                developer: 'Valve',
                synopsis: 'Gordon Freeman lidera la resistencia humana contra el imperio alienígena Combine en Ciudad 17.',
                cover_url: '/assets/covers/HL2.webp'
            },
            {
                title: 'Knight Rider 2: The Game',
                genre: 'Carreras',
                platform: 'PC / PS2',
                release_year: 2004,
                developer: 'Davilex Games',
                synopsis: 'Conduce a KITT, el auto fantástico de la icónica serie ochentosa, resolviendo crímenes a alta velocidad.',
                cover_url: '/assets/covers/Knight_Rider_2.webp'
            },
            {
                title: 'League of Legends',
                genre: 'MOBA',
                platform: 'PC',
                release_year: 2009,
                developer: 'Riot Games',
                synopsis: 'Estrategia en equipo por carriles donde dos equipos de cinco campeones luchan por destruir el Nexo enemigo.',
                cover_url: '/assets/covers/league of legends.jpg'
            },
            {
                title: 'Motocross Madness 2',
                genre: 'Carreras',
                platform: 'PC',
                release_year: 2000,
                developer: 'Rainbow Studios',
                synopsis: 'Acrobacias extremas, saltos kilométricos y carreras de motocross en pistas abiertas y estadios cerrados.',
                cover_url: '/assets/covers/motocross madness.webp'
            },
            {
                title: 'Need for Speed: Most Wanted',
                genre: 'Carreras',
                platform: 'PC / PS2 / Xbox 360',
                release_year: 2005,
                developer: 'EA Black Box',
                synopsis: 'Conviértete en el piloto clandestino más buscado de Rockport escalando la famosa Blacklist 15.',
                cover_url: '/assets/covers/nfs mw.webp'
            },
            {
                title: 'Quake 4',
                genre: 'Shooter',
                platform: 'PC / Xbox 360',
                release_year: 2005,
                developer: 'Raven Software',
                synopsis: 'Matthew Kane combate en el planeta Stroggos en una cruenta guerra de invasión y bio-mecatrónica.',
                cover_url: '/assets/covers/quake_4-1679490.webp'
            },
            {
                title: 'Red Dead Redemption 2',
                genre: 'Mundo Abierto',
                platform: 'PC / PS4 / Xbox One',
                release_year: 2018,
                developer: 'Rockstar Games',
                synopsis: 'La épica historia de Arthur Morgan y la banda de Van der Linde en el ocaso del salvaje oeste americano.',
                cover_url: '/assets/covers/red dead 2.webp'
            },
            {
                title: 'Resident Evil 4',
                genre: 'Survival Horror',
                platform: 'Multiplataforma',
                release_year: 2005,
                developer: 'Capcom',
                synopsis: 'Leon S. Kennedy viaja a una aldea rural europea para rescatar a la hija secuestrada del presidente.',
                cover_url: '/assets/covers/resident evil 4.jpg'
            },
            {
                title: 'Road Rash',
                genre: 'Carreras',
                platform: 'PC / Genesis',
                release_year: 1991,
                developer: 'Electronic Arts',
                synopsis: 'Carreras ilegales de motocicletas donde golpear y derribar a los rivales con palos y cadenas es parte del juego.',
                cover_url: '/assets/covers/road rash.jpg'
            },
            {
                title: 'Star Wars: Knights of the Old Republic',
                genre: 'RPG',
                platform: 'PC / Xbox',
                release_year: 2003,
                developer: 'BioWare',
                synopsis: 'Cuatro mil años antes del Imperio Galáctico, decide el destino de la galaxia abrazando la Luz o el Lado Oscuro.',
                cover_url: '/assets/covers/star wars.jpg'
            },
            {
                title: 'Uncharted 4: A Thief\'s End',
                genre: 'Aventura',
                platform: 'PS4 / PC',
                release_year: 2016,
                developer: 'Naughty Dog',
                synopsis: 'Nathan Drake sale de su retiro para ayudar a su hermano Sam en la búsqueda del tesoro pirata de Libertalia.',
                cover_url: '/assets/covers/Uncharted_4_portada.webp'
            },
            {
                title: 'Grand Theft Auto: Vice City',
                genre: 'Mundo Abierto',
                platform: 'PC / PS2',
                release_year: 2002,
                developer: 'Rockstar North',
                synopsis: 'Tommy Vercetti construye su imperio criminal en una radiante y decadente metrópoli tropical ochentosa.',
                cover_url: '/assets/covers/vice city.jpg'
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

    // 2. Ensure Administrator account always exists (admin@gamevault.com / admin1234)
    try {
        const [adminCheck] = await db.query("SELECT id FROM users WHERE email = 'admin@gamevault.com' LIMIT 1");
        if (!adminCheck || adminCheck.length === 0) {
            console.log('[Database] Inicializando cuenta de administrador oficial (admin@gamevault.com)...');
            const adminHash = await bcrypt.hash('admin1234', 10);
            await db.query(
                `INSERT INTO users (username, email, password_hash, avatar, bio, platform, role, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                ['admin', 'admin@gamevault.com', adminHash, '/assets/avatars/pixel-marine.svg', 'Administrador General de GameVault.', 'PC Master Race', 'admin', 'active']
            );
        }
    } catch (e) {
        console.error('[Database] Warning verificando admin:', e.message);
    }

    // 3. Ensure Demo Gamer account always exists independently (gamer@tudai.edu.ar / gamer1234)
    try {
        const [gamerCheck] = await db.query("SELECT id FROM users WHERE email = 'gamer@tudai.edu.ar' LIMIT 1");
        if (!gamerCheck || gamerCheck.length === 0) {
            console.log('[Database] Creando usuario gamer de demostración (gamer@tudai.edu.ar)...');
            const passwordHash = await bcrypt.hash('gamer1234', 10);
            const [res] = await db.query(
                `INSERT INTO users (username, email, password_hash, avatar, bio, platform, role, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                ['juan_luca', 'gamer@tudai.edu.ar', passwordHash, '/assets/avatars/pixel-knight.svg', 'Estudiante TUDAI - Jugando clásicos y completando el backlog.', 'PC Master Race', 'user', 'active']
            );
            const demoUserId = res.insertId;

            // Add 8 sample games to user library with varied statuses and ratings
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

            // Look up the inserted library rows for game 1 and game 13 to attach play sessions
            const [libRows] = await db.query(
                'SELECT id, game_id FROM user_library WHERE user_id = ? AND game_id IN (1, 13) ORDER BY game_id ASC',
                [demoUserId]
            );
            if (libRows && libRows.length >= 2) {
                await db.query(
                    `INSERT INTO play_sessions (user_library_id, hours, session_date, notes)
                     VALUES 
                     (?, 3.5, '2026-10-15', 'Campaña de Juana de Arco completada'),
                     (?, 5.0, '2026-10-16', 'Caza legendaria y misiones del Capítulo 3')`,
                    [libRows[0].id, libRows[1].id]
                );
            }

            // Create a sample thematic list for the demo user
            const [listRes] = await db.query(
                `INSERT INTO custom_lists (user_id, name, description)
                 VALUES (?, ?, ?)`,
                [demoUserId, 'Clásicos Inmortales', 'Mis obras maestras favoritas de todos los tiempos para rejugar.']
            );
            const demoListId = listRes.insertId;
            await db.query(
                `INSERT INTO custom_list_items (list_id, game_id)
                 VALUES (?, 1), (?, 7), (?, 14)`,
                [demoListId, demoListId, demoListId]
            );
        }
    } catch (e) {
        console.error('[Database] Warning verificando usuario demo:', e.message);
    }
}

function closeDatabase() {
    if (dbInstance && typeof dbInstance.close === 'function') {
        try { dbInstance.close(); } catch (_) {}
        dbInstance = null;
    }
}

module.exports = {
    db,
    initDatabase,
    seedInitialData,
    closeDatabase
};
