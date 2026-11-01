const { db } = require('../config/database');

const ListModel = {
    async getUserLists(userId) {
        const [rows] = await db.query(
            `SELECT cl.id, cl.name, cl.description, cl.created_at,
                    COUNT(cli.game_id) as total_games
             FROM custom_lists cl
             LEFT JOIN custom_list_items cli ON cl.id = cli.list_id
             WHERE cl.user_id = ?
             GROUP BY cl.id
             ORDER BY cl.created_at DESC`,
            [userId]
        );
        return rows;
    },

    async getListById(listId, userId) {
        const [lists] = await db.query(
            'SELECT * FROM custom_lists WHERE id = ? AND user_id = ?',
            [listId, userId]
        );
        if (!lists || lists.length === 0) return null;

        const list = lists[0];
        const [games] = await db.query(
            `SELECT g.id as game_id, g.title, g.genre, g.platform, g.cover_url, g.developer, cli.added_at
             FROM custom_list_items cli
             JOIN games g ON cli.game_id = g.id
             WHERE cli.list_id = ?
             ORDER BY cli.added_at DESC`,
            [listId]
        );
        list.games = games;
        return list;
    },

    async createList(userId, { name, description }) {
        const [result] = await db.query(
            'INSERT INTO custom_lists (user_id, name, description) VALUES (?, ?, ?)',
            [userId, name, description || null]
        );
        return result.insertId;
    },

    async addGameToList(listId, userId, gameId) {
        // Ownership check
        const [lists] = await db.query(
            'SELECT id FROM custom_lists WHERE id = ? AND user_id = ?',
            [listId, userId]
        );
        if (!lists || lists.length === 0) return { error: 'NOT_FOUND_OR_FORBIDDEN' };

        // Check if game already in list
        const [existing] = await db.query(
            'SELECT id FROM custom_list_items WHERE list_id = ? AND game_id = ?',
            [listId, gameId]
        );
        if (existing && existing.length > 0) return { error: 'ALREADY_EXISTS' };

        const [result] = await db.query(
            'INSERT INTO custom_list_items (list_id, game_id) VALUES (?, ?)',
            [listId, gameId]
        );
        return { success: true, id: result.insertId };
    },

    async removeGameFromList(listId, userId, gameId) {
        // Ownership check
        const [lists] = await db.query(
            'SELECT id FROM custom_lists WHERE id = ? AND user_id = ?',
            [listId, userId]
        );
        if (!lists || lists.length === 0) return { error: 'NOT_FOUND_OR_FORBIDDEN' };

        const [result] = await db.query(
            'DELETE FROM custom_list_items WHERE list_id = ? AND game_id = ?',
            [listId, gameId]
        );
        return { success: true, affected: result.affectedRows };
    },

        async updateList(listId, userId, { name, description }) {
        // Ownership check
        const [lists] = await db.query(
            'SELECT id FROM custom_lists WHERE id = ? AND user_id = ?',
            [listId, userId]
        );
        if (!lists || lists.length === 0) return false;

        const [result] = await db.query(
            `UPDATE custom_lists
             SET name = COALESCE(?, name),
                 description = COALESCE(?, description)
             WHERE id = ? AND user_id = ?`,
            [name !== undefined ? name : null, description !== undefined ? description : null, listId, userId]
        );
        return result.affectedRows > 0;
    },

    async deleteList(listId, userId) {
        const [result] = await db.query(
            'DELETE FROM custom_lists WHERE id = ? AND user_id = ?',
            [listId, userId]
        );
        return result.affectedRows > 0;
    }
};

module.exports = ListModel;

