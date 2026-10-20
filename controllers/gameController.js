const GameModel = require('../models/gameModel');

const GameController = {
    async getGames(req, res, next) {
        try {
            const { search, genre, platform } = req.query;
            const games = await GameModel.getAll({ search, genre, platform });
            res.status(200).json({
                success: true,
                count: games.length,
                data: games
            });
        } catch (err) {
            next(err);
        }
    },

    async getGameById(req, res, next) {
        try {
            const { id } = req.params;
            const game = await GameModel.getById(id);
            if (!game) {
                return res.status(404).json({
                    success: false,
                    message: 'Videojuego no encontrado en el catálogo.'
                });
            }
            res.status(200).json({
                success: true,
                data: game
            });
        } catch (err) {
            next(err);
        }
    },

    async getFilters(req, res, next) {
        try {
            const genres = await GameModel.getGenres();
            const platforms = await GameModel.getPlatforms();
            res.status(200).json({
                success: true,
                genres,
                platforms
            });
        } catch (err) {
            next(err);
        }
    },

    async getGameReviews(req, res, next) {
        try {
            const { id } = req.params;
            const game = await GameModel.getById(id);
            if (!game) {
                return res.status(404).json({
                    success: false,
                    message: 'Videojuego no encontrado.'
                });
            }
            const reviews = await GameModel.getReviewsByGameId(id);
            res.status(200).json({
                success: true,
                count: reviews.length,
                data: reviews
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = GameController;

