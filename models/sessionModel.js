const { db } = require('../config/database');

const SessionModel = {
    async createSession({ user_library_id, hours, session_date, notes }) {
        const [result] = await db.query(
            `INSERT INTO play_sessions (user_library_id, hours, session_date, notes)
             VALUES (?, ?, ?, ?)`,
            [user_library_id, hours, session_date, notes || null]
        );

        // Transactional automatic increment of total hours played in library
        await db.query(
            `UPDATE user_library
             SET hours_played = hours_played + ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [hours, user_library_id]
        );

        const [lib] = await db.query(
            'SELECT hours_played FROM user_library WHERE id = ?',
            [user_library_id]
        );

        return {
            session_id: result.insertId,
            new_total_hours: lib[0]?.hours_played || 0
        };
    },

    async getSessionsByLibraryId(user_library_id) {
        const [rows] = await db.query(
            `SELECT id, user_library_id, hours, session_date, notes, created_at
             FROM play_sessions
             WHERE user_library_id = ?
             ORDER BY session_date DESC, id DESC`,
            [user_library_id]
        );
        return rows;
    },

    async getUserRecentSessions(userId, limit = 10) {
        const [rows] = await db.query(
            `SELECT ps.id, ps.hours, ps.session_date, ps.notes, g.title, g.cover_url
             FROM play_sessions ps
             JOIN user_library ul ON ps.user_library_id = ul.id
             JOIN games g ON ul.game_id = g.id
             WHERE ul.user_id = ?
             ORDER BY ps.session_date DESC, ps.id DESC
             LIMIT ?`,
            [userId, limit]
        );
        return rows;
    }
};

module.exports = SessionModel;

