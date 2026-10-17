const LibraryModel = require('../models/libraryModel');

const LibraryController = {
    async getLibrary(req, res, next) {
        try {
            const { status, priority, search } = req.query;
            const items = await LibraryModel.getUserLibrary(req.user.id, { status, priority, search });
            res.status(200).json({
                success: true,
                count: items.length,
                data: items
            });
        } catch (err) {
            next(err);
        }
    },

    async addGame(req, res, next) {
        try {
            const { game_id, status, priority, hours_played, rating, review } = req.body;

            if (!game_id) {
                return res.status(400).json({
                    success: false,
                    message: 'El identificador del juego (game_id) es obligatorio.'
                });
            }

            // Check if already in user library
            const existing = await LibraryModel.getEntryByUserAndGame(req.user.id, game_id);
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'Este videojuego ya se encuentra catalogado en tu biblioteca personal.'
                });
            }

            const insertId = await LibraryModel.addGame(req.user.id, {
                game_id,
                status: status || 'pending',
                priority: priority || 'medium',
                hours_played: hours_played || 0,
                rating: rating ? parseInt(rating) : null,
                review: review || null
            });

            const entry = await LibraryModel.getEntryById(insertId);

            res.status(201).json({
                success: true,
                message: 'Juego agregado a tu biblioteca exitosamente.',
                data: entry
            });
        } catch (err) {
            next(err);
        }
    },

    async updateGame(req, res, next) {
        try {
            const { id } = req.params;
            const { status, priority, hours_played, rating, review, is_favorite } = req.body;

            const existing = await LibraryModel.getEntryById(id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: 'Entrada de biblioteca no encontrada.'
                });
            }

            if (existing.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para modificar este registro.'
                });
            }

            const updated = await LibraryModel.updateEntry(id, req.user.id, {
                status,
                priority,
                hours_played: hours_played !== undefined ? parseFloat(hours_played) : existing.hours_played,
                rating: rating !== undefined ? (rating ? parseInt(rating) : null) : existing.rating,
                review: review !== undefined ? review : existing.review,
                is_favorite: is_favorite !== undefined ? is_favorite : existing.is_favorite
            });

            res.status(200).json({
                success: true,
                message: 'Información de juego actualizada exitosamente.',
                data: updated
            });
        } catch (err) {
            next(err);
        }
    },

    async deleteGame(req, res, next) {
        try {
            const { id } = req.params;

            const existing = await LibraryModel.getEntryById(id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: 'Entrada de biblioteca no encontrada.'
                });
            }

            if (existing.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para eliminar este registro.'
                });
            }

            await LibraryModel.deleteEntry(id, req.user.id);

            res.status(200).json({
                success: true,
                message: 'Videojuego eliminado de tu biblioteca personal.'
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = LibraryController;

