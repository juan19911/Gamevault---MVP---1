const { db } = require('../config/database');

const StatsModel = {
    async getUserDashboard(userId) {
        // Summary KPIs
        const [totalRows] = await db.query(
            'SELECT COUNT(*) as total_games FROM user_library WHERE user_id = ?',
            [userId]
        );
        const totalGames = totalRows[0]?.total_games || 0;

        // Breakdown by status
        const [statusRows] = await db.query(
            `SELECT status, COUNT(*) as count, SUM(hours_played) as total_hours
             FROM user_library
             WHERE user_id = ?
             GROUP BY status`,
            [userId]
        );

        const statusMap = { pending: 0, playing: 0, completed: 0, dropped: 0 };
        let totalHours = 0;
        statusRows.forEach(row => {
            statusMap[row.status] = row.count;
            totalHours += Number(row.total_hours) || 0;
        });

        const completedCount = statusMap.completed;
        const completedPct = totalGames > 0 ? ((completedCount / totalGames) * 100).toFixed(1) : '0.0';

        // Dominant genre
        const [genreRows] = await db.query(
            `SELECT g.genre, COUNT(*) as count, SUM(ul.hours_played) as genre_hours
             FROM user_library ul
             JOIN games g ON ul.game_id = g.id
             WHERE ul.user_id = ?
             GROUP BY g.genre
             ORDER BY count DESC, genre_hours DESC`,
            [userId]
        );

        const dominantGenre = genreRows[0]?.genre || 'Variado';

        // Top played games
        const [topGames] = await db.query(
            `SELECT g.id, g.title, g.cover_url, g.genre, ul.hours_played, ul.rating, ul.status
             FROM user_library ul
             JOIN games g ON ul.game_id = g.id
             WHERE ul.user_id = ? AND ul.hours_played > 0
             ORDER BY ul.hours_played DESC
             LIMIT 5`,
            [userId]
        );

        return {
            summary: {
                total_games: totalGames,
                completed_count: completedCount,
                completed_pct: completedPct,
                total_hours: parseFloat(totalHours.toFixed(1)),
                dominant_genre: dominantGenre
            },
            charts: {
                by_status: {
                    labels: ['Pendiente', 'Jugando', 'Completado', 'Abandonado'],
                    data: [statusMap.pending, statusMap.playing, statusMap.completed, statusMap.dropped]
                },
                by_genre: {
                    labels: genreRows.slice(0, 6).map(r => r.genre),
                    data: genreRows.slice(0, 6).map(r => r.count)
                }
            },
            top_games: topGames
        };
    },

    async getRandomPending(userId, onlyHighPriority = false) {
        let sql = `
            SELECT ul.id AS library_id, g.id AS game_id, g.title, g.genre, g.platform, g.synopsis, g.cover_url, g.release_year, g.developer, ul.priority
            FROM user_library ul
            JOIN games g ON ul.game_id = g.id
            WHERE ul.user_id = ? AND ul.status = 'pending'
        `;
        const params = [userId];

        if (onlyHighPriority) {
            sql += " AND ul.priority = 'high'";
        }

        // Dual Engine: MySQL RAND() vs SQLite RANDOM() (T-7.1)
        const randomFn = (process.env.DB_CLIENT === 'mysql') ? 'RAND()' : 'RANDOM()';
        sql += ` ORDER BY ${randomFn} LIMIT 1`;

        const [rows] = await db.query(sql, params);
        return rows[0] || null;
    },

    async countPendingByUser(userId, onlyHighPriority = false) {
        let sql = "SELECT COUNT(*) as count FROM user_library WHERE user_id = ? AND status = 'pending'";
        if (onlyHighPriority) {
            sql += " AND priority = 'high'";
        }
        const [rows] = await db.query(sql, [userId]);
        return rows[0]?.count || 0;
    },

    async getRecommendations(userId) {
        // 1. Dominant genre for this user
        const [genres] = await db.query(
            `SELECT g.genre, COUNT(*) as cnt
             FROM user_library ul
             JOIN games g ON ul.game_id = g.id
             WHERE ul.user_id = ?
             GROUP BY g.genre
             ORDER BY cnt DESC
             LIMIT 1`,
            [userId]
        );

        const topGenre = genres[0]?.genre || null;

        // Games of top genre not in user's library
        let genreRecommendations = [];
        if (topGenre) {
            const [recs] = await db.query(
                `SELECT g.*
                 FROM games g
                 WHERE g.genre = ?
                   AND g.id NOT IN (SELECT game_id FROM user_library WHERE user_id = ?)
                 LIMIT 4`,
                [topGenre, userId]
            );
            genreRecommendations = recs;
        }

        // Community favorites (highest rated games in library or general catalog)
        const [communityFavorites] = await db.query(
            `SELECT g.id, g.title, g.genre, g.platform, g.cover_url,
                    ROUND(AVG(ul.rating), 1) as avg_rating,
                    COUNT(ul.id) as total_ratings
             FROM games g
             LEFT JOIN user_library ul ON g.id = ul.game_id AND ul.rating IS NOT NULL
             GROUP BY g.id
             ORDER BY avg_rating DESC, total_ratings DESC
             LIMIT 4`
        );

        return {
            dominant_genre: topGenre,
            genre_recommendations: genreRecommendations,
            community_favorites: communityFavorites
        };
    }
};

module.exports = StatsModel;

