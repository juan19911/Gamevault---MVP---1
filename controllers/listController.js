const ListModel = require('../models/listModel');

const ListController = {
    async getMyLists(req, res, next) {
        try {
            const lists = await ListModel.getUserLists(req.user.id);
            res.status(200).json({
                success: true,
                count: lists.length,
                data: lists
            });
        } catch (err) {
            next(err);
        }
    },

    async getListDetails(req, res, next) {
        try {
            const { id } = req.params;
            const list = await ListModel.getListById(id, req.user.id);
            if (!list) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista temática no encontrada o no tienes permisos para acceder.'
                });
            }
            res.status(200).json({
                success: true,
                data: list
            });
        } catch (err) {
            next(err);
        }
    },

    async createList(req, res, next) {
        try {
            const { name, description } = req.body;
            if (!name || name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de la lista temática es obligatorio.'
                });
            }

            const insertId = await ListModel.createList(req.user.id, {
                name: name.trim(),
                description: description ? description.trim() : null
            });

            const created = await ListModel.getListById(insertId, req.user.id);
            res.status(201).json({
                success: true,
                message: 'Lista temática creada con éxito.',
                data: created
            });
        } catch (err) {
            next(err);
        }
    },

    async addGame(req, res, next) {
        try {
            const { id } = req.params;
            const { game_id } = req.body;

            if (!game_id) {
                return res.status(400).json({
                    success: false,
                    message: 'El identificador del juego (game_id) es obligatorio.'
                });
            }

            const result = await ListModel.addGameToList(id, req.user.id, game_id);
            if (result.error === 'NOT_FOUND_OR_FORBIDDEN') {
                return res.status(404).json({
                    success: false,
                    message: 'Lista no encontrada o no autorizada.'
                });
            }
            if (result.error === 'ALREADY_EXISTS') {
                return res.status(409).json({
                    success: false,
                    message: 'Este videojuego ya se encuentra agregado a esta lista.'
                });
            }

            res.status(201).json({
                success: true,
                message: 'Videojuego añadido a la lista temática.'
            });
        } catch (err) {
            next(err);
        }
    },

    async removeGame(req, res, next) {
        try {
            const { id, gameId } = req.params;
            const result = await ListModel.removeGameFromList(id, req.user.id, gameId);
            if (result.error === 'NOT_FOUND_OR_FORBIDDEN') {
                return res.status(404).json({
                    success: false,
                    message: 'Lista no encontrada o no autorizada.'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Videojuego quitado de la lista temática.'
            });
        } catch (err) {
            next(err);
        }
    },

        async updateList(req, res, next) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            if (name !== undefined && name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de la lista temática no puede estar vacío.'
                });
            }

            const updated = await ListModel.updateList(id, req.user.id, {
                name: name ? name.trim() : undefined,
                description: description !== undefined ? description.trim() : undefined
            });

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista temática no encontrada o no autorizada para modificar.'
                });
            }

            const list = await ListModel.getListById(id, req.user.id);
            res.status(200).json({
                success: true,
                message: 'Lista temática modificada con éxito.',
                data: list
            });
        } catch (err) {
            next(err);
        }
    },

    async deleteList(req, res, next) {
        try {
            const { id } = req.params;
            const deleted = await ListModel.deleteList(id, req.user.id);
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Lista no encontrada o no autorizada.'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Lista temática eliminada exitosamente.'
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = ListController;

