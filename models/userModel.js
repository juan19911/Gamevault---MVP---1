const { db } = require('../config/database');

const UserModel = {
    async findByEmail(email) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [email.toLowerCase().trim()]
        );
        return rows[0] || null;
    },

    async findByUsername(username) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE username = ? LIMIT 1',
            [username.trim()]
        );
        return rows[0] || null;
    },

    async findById(id) {
        const [rows] = await db.query(
            'SELECT id, username, email, avatar, bio, platform, role, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    },

    async create({ username, email, passwordHash }) {
        const [result] = await db.query(
            `INSERT INTO users (username, email, password_hash)
             VALUES (?, ?, ?)`,
            [username.trim(), email.toLowerCase().trim(), passwordHash]
        );
        return result.insertId;
    },

    async updateProfile(id, { bio, platform, avatar }) {
        await db.query(
            `UPDATE users 
             SET bio = COALESCE(?, bio),
                 platform = COALESCE(?, platform),
                 avatar = COALESCE(?, avatar)
             WHERE id = ?`,
            [bio, platform, avatar, id]
        );
        return this.findById(id);
    },

    async getFavorites(userId) {
        const [rows] = await db.query(
            `SELECT g.id, g.title, g.genre, g.platform, g.cover_url, ul.rating, ul.hours_played
             FROM user_library ul
             JOIN games g ON ul.game_id = g.id
             WHERE ul.user_id = ? AND ul.is_favorite = 1
             ORDER BY ul.rating DESC, ul.hours_played DESC
             LIMIT 4`,
            [userId]
        );
        return rows;
    },

    async setFavorites(userId, gameIds) {
        // Strict limit: at most 4 games (HU-02)
        const safeIds = Array.isArray(gameIds) ? gameIds.slice(0, 4) : [];

        // Clear current favorites
        await db.query(
            'UPDATE user_library SET is_favorite = 0 WHERE user_id = ?',
            [userId]
        );

        if (safeIds.length > 0) {
            // Set new favorites
            for (const gId of safeIds) {
                await db.query(
                    'UPDATE user_library SET is_favorite = 1 WHERE user_id = ? AND game_id = ?',
                    [userId, gId]
                );
            }
        }

        return this.getFavorites(userId);
    },

    async updatePassword(id, passwordHash) {
        await db.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [passwordHash, id]
        );
        return true;
    },

    async getPasswordHash(id) {
        const [rows] = await db.query(
            'SELECT password_hash FROM users WHERE id = ?',
            [id]
        );
        return rows[0]?.password_hash || null;
    },

    async getAllUsers() {
        const [rows] = await db.query(
            `SELECT u.id, u.username, u.email, u.avatar, u.bio, u.platform, u.role, u.created_at,
                    COUNT(ul.id) AS total_games
             FROM users u
             LEFT JOIN user_library ul ON u.id = ul.user_id
             GROUP BY u.id
             ORDER BY u.id ASC`
        );
        return rows;
    },

    async updateRole(id, role) {
        const validRoles = ['user', 'admin'];
        if (!validRoles.includes(role)) {
            throw new Error('Rol inválido. Se espera: user o admin.');
        }
        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        return this.findById(id);
    }
};

module.exports = UserModel;
