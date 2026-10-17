const StatsModel = require('../models/statsModel');

const StatsController = {
    async getDashboard(req, res, next) {
        try {
            const stats = await StatsModel.getUserDashboard(req.user.id);
            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (err) {
            next(err);
        }
    },

    async getRandomGame(req, res, next) {
        try {
            const onlyHigh = req.query.priority === 'high';
            const randomGame = await StatsModel.getRandomPending(req.user.id, onlyHigh);

            if (!randomGame) {
                return res.status(200).json({
                    success: true,
                    message: onlyHigh
                        ? 'No tienes juegos pendientes con prioridad Alta.'
                        : 'No tienes juegos pendientes en tu biblioteca. ¡Explora el catálogo y agrega uno!',
                    data: null
                });
            }

            res.status(200).json({
                success: true,
                data: randomGame
            });
        } catch (err) {
            next(err);
        }
    },

    async getRecommendations(req, res, next) {
        try {
            const recommendations = await StatsModel.getRecommendations(req.user.id);
            res.status(200).json({
                success: true,
                data: recommendations
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = StatsController;

