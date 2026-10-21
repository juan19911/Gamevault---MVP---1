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
                const totalPending = await StatsModel.countPendingByUser(req.user.id, false);
                const message = (onlyHigh && totalPending > 0)
                    ? 'No posees videojuegos pendientes clasificados con Prioridad Alta. Desmarca la casilla para sortear entre todos tus pendientes.'
                    : 'No tienes videojuegos en estado Pendiente en tu biblioteca personal. Explora el catálogo para agregar títulos a tu backlog.';

                return res.status(200).json({
                    success: true,
                    message,
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

