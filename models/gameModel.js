const { db } = require('../config/database');

const GameModel = {
    async getAll({ search = '', genre = '', platform = '' } = {}) {
        let sql = `
            SELECT id, title, genre, platform, release_year, developer, synopsis, cover_url, created_at
            FROM games
            WHERE 1=1
        `;
        const params = [];

        if (search && search.trim() !== '') {
            sql += ' AND (title LIKE ? OR developer LIKE ?)';
            const term = `%${search.trim()}%`;
            params.push(term, term);
        }

        if (genre && genre.trim() !== '') {
            sql += ' AND genre = ?';
            params.push(genre.trim());
        }

        if (platform && platform.trim() !== '') {
            sql += ' AND platform LIKE ?';
            params.push(`%${platform.trim()}%`);
        }

        sql += ' ORDER BY release_year DESC, title ASC';

        const [rows] = await db.query(sql, params);
        return rows;
    },

    async getById(id) {
        const [rows] = await db.query(
            'SELECT * FROM games WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    },

    async getGenres() {
        const [rows] = await db.query(
            'SELECT DISTINCT genre FROM games ORDER BY genre ASC'
        );
        return rows.map(r => r.genre);
    },

    async getPlatforms() {
        const [rows] = await db.query(
            'SELECT DISTINCT platform FROM games ORDER BY platform ASC'
        );
        return rows.map(r => r.platform);
    },

    async getReviewsByGameId(gameId) {
        const [rows] = await db.query(
            `SELECT ul.id, ul.rating, ul.review, ul.updated_at,
                    u.username, u.avatar
             FROM user_library ul
             JOIN users u ON ul.user_id = u.id
             WHERE ul.game_id = ? AND (ul.review IS NOT NULL AND ul.review != '')
             ORDER BY ul.updated_at DESC`,
            [gameId]
        );
        return rows;
    }
};

module.exports = GameModel;
