const { db } = require('../config/database');

const LibraryModel = {
    async getUserLibrary(userId, { status = '', priority = '', search = '' } = {}) {
        let sql = `
            SELECT 
                ul.id AS library_id,
                ul.user_id,
                ul.game_id,
                ul.status,
                ul.priority,
                ul.hours_played,
                ul.rating,
                ul.review,
                ul.is_favorite,
                ul.updated_at,
                g.title,
                g.genre,
                g.platform,
                g.release_year,
                g.developer,
                g.cover_url
            FROM user_library ul
            JOIN games g ON ul.game_id = g.id
            WHERE ul.user_id = ?
        `;
        const params = [userId];

        if (status && status !== 'all') {
            sql += ' AND ul.status = ?';
            params.push(status);
        }

        if (priority && priority !== 'all') {
            sql += ' AND ul.priority = ?';
            params.push(priority);
        }

        if (search && search.trim() !== '') {
            sql += ' AND g.title LIKE ?';
            params.push(`%${search.trim()}%`);
        }

        sql += ' ORDER BY ul.updated_at DESC';

        const [rows] = await db.query(sql, params);
        return rows;
    },

    async getEntryById(libraryId) {
        const [rows] = await db.query(
            `SELECT ul.*, g.title, g.cover_url, g.genre
             FROM user_library ul
             JOIN games g ON ul.game_id = g.id
             WHERE ul.id = ?`,
            [libraryId]
        );
        return rows[0] || null;
    },

    async getEntryByUserAndGame(userId, gameId) {
        const [rows] = await db.query(
            'SELECT * FROM user_library WHERE user_id = ? AND game_id = ?',
            [userId, gameId]
        );
        return rows[0] || null;
    },

    async countUserFavorites(userId) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as count FROM user_library WHERE user_id = ? AND is_favorite = 1',
            [userId]
        );
        return rows[0]?.count || 0;
    },

    async addGame(userId, { game_id, status = 'pending', priority = 'medium', hours_played = 0, rating = null, review = null, is_favorite = 0 }) {
        const [result] = await db.query(
            `INSERT INTO user_library (user_id, game_id, status, priority, hours_played, rating, review, is_favorite)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, game_id, status, priority, hours_played || 0, rating || null, review || null, is_favorite ? 1 : 0]
        );
        return result.insertId;
    },

    async updateEntry(libraryId, userId, { status, priority, hours_played, rating, review, is_favorite }) {
        // Ownership verified by user_id condition in query (Anti-IDOR)
        await db.query(
            `UPDATE user_library 
             SET status = COALESCE(?, status),
                 priority = COALESCE(?, priority),
                 hours_played = COALESCE(?, hours_played),
                 rating = ?,
                 review = ?,
                 is_favorite = COALESCE(?, is_favorite),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?`,
            [status, priority, hours_played, rating, review, is_favorite, libraryId, userId]
        );
        return this.getEntryById(libraryId);
    },

    async deleteEntry(libraryId, userId) {
        const [result] = await db.query(
            'DELETE FROM user_library WHERE id = ? AND user_id = ?',
            [libraryId, userId]
        );
        return result.affectedRows > 0;
    }
};

module.exports = LibraryModel;

