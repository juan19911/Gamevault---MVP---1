const UserModel = require('../models/userModel');
const GameModel = require('../models/gameModel');
const { db } = require('../config/database');

const AdminController = {
    // 1. Obtener lista completa de usuarios
    async getUsers(req, res, next) {
        try {
            const users = await UserModel.getAllUsers();
            res.status(200).json({
                success: true,
                count: users.length,
                data: users
            });
        } catch (err) {
            next(err);
        }
    },

    // 2. Modificar rol de usuario (user <-> admin)
    async updateUserRole(req, res, next) {
        try {
            const { id } = req.params;
            const { role } = req.body;

            if (!role || !['user', 'admin'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Rol inválido. Se espera: "user" o "admin".'
                });
            }

            const updated = await UserModel.updateRole(id, role);
            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado.'
                });
            }

            res.status(200).json({
                success: true,
                message: `Rol del usuario #${id} actualizado a "${role}" con éxito.`,
                data: updated
            });
        } catch (err) {
            next(err);
        }
    },

    // 3. Crear nuevo juego en el catálogo
    async createGame(req, res, next) {
        try {
            const { title, genre, platform, release_year, developer, synopsis, cover_url } = req.body;

            if (!title || !genre || !platform) {
                return res.status(400).json({
                    success: false,
                    message: 'Los campos title, genre y platform son obligatorios.'
                });
            }

            const newGame = await GameModel.create({
                title,
                genre,
                platform,
                release_year,
                developer,
                synopsis,
                cover_url
            });

            res.status(201).json({
                success: true,
                message: 'Videojuego añadido al catálogo oficial exitosamente.',
                data: newGame
            });
        } catch (err) {
            next(err);
        }
    },

    // 4. Modificar juego existente
    async updateGame(req, res, next) {
        try {
            const { id } = req.params;
            const { title, genre, platform, release_year, developer, synopsis, cover_url } = req.body;

            const existing = await GameModel.getById(id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: 'Videojuego no encontrado en el catálogo.'
                });
            }

            const updated = await GameModel.update(id, {
                title,
                genre,
                platform,
                release_year,
                developer,
                synopsis,
                cover_url
            });

            res.status(200).json({
                success: true,
                message: 'Videojuego actualizado con éxito.',
                data: updated
            });
        } catch (err) {
            next(err);
        }
    },

    // 5. Eliminar juego del catálogo
    async deleteGame(req, res, next) {
        try {
            const { id } = req.params;

            const existing = await GameModel.getById(id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: 'Videojuego no encontrado en el catálogo.'
                });
            }

            await GameModel.delete(id);

            res.status(200).json({
                success: true,
                message: `El videojuego "${existing.title}" fue eliminado del catálogo correctamente.`
            });
        } catch (err) {
            next(err);
        }
    },

    // 6. Métricas y estadísticas del sistema para admin
    async getSystemStats(req, res, next) {
        try {
            const [usersCount] = await db.query('SELECT COUNT(*) as count FROM users');
            const [gamesCount] = await db.query('SELECT COUNT(*) as count FROM games');
            const [libraryCount] = await db.query('SELECT COUNT(*) as count FROM user_library');
            const [sessionsCount] = await db.query('SELECT COUNT(*) as count, COALESCE(SUM(hours), 0) as total_hours FROM play_sessions');
            const [genresCount] = await db.query('SELECT COUNT(DISTINCT genre) as count FROM games');

            res.status(200).json({
                success: true,
                data: {
                    total_users: usersCount[0]?.count || 0,
                    total_games: gamesCount[0]?.count || 0,
                    total_library_entries: libraryCount[0]?.count || 0,
                    total_sessions: sessionsCount[0]?.count || 0,
                    total_hours_logged: sessionsCount[0]?.total_hours || 0,
                    total_genres: genresCount[0]?.count || 0
                }
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = AdminController;
