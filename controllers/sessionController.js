const SessionModel = require('../models/sessionModel');
const LibraryModel = require('../models/libraryModel');

const SessionController = {
    async createSession(req, res, next) {
        try {
            const { user_library_id, hours, session_date, notes } = req.body;

            if (!user_library_id || !hours || !session_date) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos requeridos: user_library_id, hours y session_date.'
                });
            }

            const numHours = parseFloat(hours);
            if (isNaN(numHours) || numHours <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La cantidad de horas debe ser un número positivo.'
                });
            }

            // Verify ownership
            const entry = await LibraryModel.getEntryById(user_library_id);
            if (!entry) {
                return res.status(404).json({
                    success: false,
                    message: 'El juego indicado no existe en tu biblioteca.'
                });
            }

            if (entry.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'No puedes registrar sesiones para la biblioteca de otro usuario.'
                });
            }

            const result = await SessionModel.createSession({
                user_library_id,
                hours: numHours,
                session_date,
                notes
            });

            res.status(201).json({
                success: true,
                message: 'Sesión de juego registrada en la bitácora.',
                data: result
            });
        } catch (err) {
            next(err);
        }
    },

    async getSessionsByLibraryId(req, res, next) {
        try {
            const { id } = req.params;
            const entry = await LibraryModel.getEntryById(id);
            if (!entry) {
                return res.status(404).json({
                    success: false,
                    message: 'Entrada de biblioteca no encontrada.'
                });
            }

            if (entry.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado.'
                });
            }

            const sessions = await SessionModel.getSessionsByLibraryId(id);
            res.status(200).json({
                success: true,
                game: { id: entry.game_id, title: entry.title, cover_url: entry.cover_url },
                data: sessions
            });
        } catch (err) {
            next(err);
        }
    },

    async getRecentSessions(req, res, next) {
        try {
            const sessions = await SessionModel.getUserRecentSessions(req.user.id, 10);
            res.status(200).json({
                success: true,
                data: sessions
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = SessionController;

