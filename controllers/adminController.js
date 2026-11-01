const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
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

    // 2.1 Crear nuevo usuario desde el panel admin (CRUD)
    async createUser(req, res, next) {
        try {
            const { username, email, password, role = 'user', status = 'active', platform = 'PC' } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Los campos username, email y password son obligatorios.'
                });
            }

            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe contener al menos 8 caracteres.'
                });
            }

            const existingEmail = await UserModel.findByEmail(email);
            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: 'El correo electrónico ya se encuentra registrado.'
                });
            }

            const existingUsername = await UserModel.findByUsername(username);
            if (existingUsername) {
                return res.status(409).json({
                    success: false,
                    message: 'El nombre de usuario ya está en uso.'
                });
            }

            const passwordHash = await bcrypt.hash(password, 10);
            const newUser = await UserModel.createAdminUser({
                username,
                email,
                passwordHash,
                role: ['admin', 'user'].includes(role) ? role : 'user',
                status: ['active', 'banned'].includes(status) ? status : 'active',
                platform
            });

            res.status(201).json({
                success: true,
                message: `Usuario "${username}" creado exitosamente en el sistema.`,
                data: newUser
            });
        } catch (err) {
            next(err);
        }
    },

    // 2.2 Modificar datos completos de un usuario (CRUD)
    async updateUser(req, res, next) {
        try {
            const { id } = req.params;
            const { username, email, role, status, platform, password } = req.body;

            const existing = await UserModel.findById(id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado.'
                });
            }

            // Check email uniqueness if changing
            if (email && email.toLowerCase().trim() !== existing.email.toLowerCase().trim()) {
                const dupEmail = await UserModel.findByEmail(email);
                if (dupEmail && dupEmail.id !== Number(id)) {
                    return res.status(409).json({
                        success: false,
                        message: 'El correo electrónico ya pertenece a otro usuario.'
                    });
                }
            }

            // Check username uniqueness if changing
            if (username && username.trim() !== existing.username.trim()) {
                const dupUser = await UserModel.findByUsername(username);
                if (dupUser && dupUser.id !== Number(id)) {
                    return res.status(409).json({
                        success: false,
                        message: 'El nombre de usuario ya pertenece a otro usuario.'
                    });
                }
            }

            let passwordHash = null;
            if (password && password.trim() !== '') {
                if (password.trim().length < 8) {
                    return res.status(400).json({
                        success: false,
                        message: 'La contraseña debe contener al menos 8 caracteres.'
                    });
                }
                passwordHash = await bcrypt.hash(password.trim(), 10);
            }

            const updated = await UserModel.updateAdminUser(id, {
                username: username ? username.trim() : null,
                email: email ? email.toLowerCase().trim() : null,
                role: role && ['user', 'admin'].includes(role) ? role : null,
                status: status && ['active', 'banned'].includes(status) ? status : null,
                platform: platform || null,
                passwordHash
            });

            res.status(200).json({
                success: true,
                message: `Usuario #${id} actualizado correctamente.`,
                data: updated
            });
        } catch (err) {
            next(err);
        }
    },

    // 2.3 Eliminar usuario del sistema (CRUD)
    async deleteUser(req, res, next) {
        try {
            const { id } = req.params;

            if (Number(id) === Number(req.user.id)) {
                return res.status(400).json({
                    success: false,
                    message: 'No puedes eliminar tu propia cuenta de administrador activa.'
                });
            }

            const existing = await UserModel.findById(id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado.'
                });
            }

            await UserModel.deleteUser(id);

            res.status(200).json({
                success: true,
                message: `El usuario "${existing.username}" y todos sus datos han sido eliminados del sistema.`
            });
        } catch (err) {
            next(err);
        }
    },

    // 2.4 Banear o desbanear usuario (Status)
    async updateUserStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status || !['active', 'banned'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado inválido. Se espera: "active" o "banned".'
                });
            }

            if (Number(id) === Number(req.user.id) && status === 'banned') {
                return res.status(400).json({
                    success: false,
                    message: 'No puedes banear tu propia cuenta de administrador.'
                });
            }

            const existing = await UserModel.findById(id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado.'
                });
            }

            const updated = await UserModel.updateStatus(id, status);

            res.status(200).json({
                success: true,
                message: status === 'banned'
                    ? `Usuario "${existing.username}" ha sido BANEADO del sistema.`
                    : `Usuario "${existing.username}" ha sido RESTABLECIDO a estado activo.`,
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
    },

    // 7. Cargar portada desde dispositivo local / PC
    async uploadCover(req, res, next) {
        try {
            const { image, filename } = req.body;
            if (!image) {
                return res.status(400).json({
                    success: false,
                    message: 'No se recibió ninguna imagen para subir.'
                });
            }

            const matches = image.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
            let ext = 'jpg';
            let base64Data = image;

            if (matches) {
                let mimeExt = matches[1].toLowerCase();
                if (mimeExt === 'jpeg') mimeExt = 'jpg';
                if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg+xml'].includes(mimeExt)) {
                    ext = mimeExt === 'svg+xml' ? 'svg' : mimeExt;
                }
                base64Data = matches[2];
            } else if (filename && filename.includes('.')) {
                const rawExt = filename.split('.').pop().toLowerCase();
                if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(rawExt)) {
                    ext = rawExt;
                }
            }

            const buffer = Buffer.from(base64Data, 'base64');
            if (buffer.length > 10 * 1024 * 1024) {
                return res.status(400).json({
                    success: false,
                    message: 'La imagen excede el límite permitido de 10 MB.'
                });
            }

            const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'covers');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const cleanSafeName = filename
                ? filename.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)
                : 'cover';
            const uniqueFileName = `cover_${Date.now()}_${cleanSafeName}.${ext}`;
            const filePath = path.join(uploadDir, uniqueFileName);

            fs.writeFileSync(filePath, buffer);

            const relativeUrl = `/uploads/covers/${uniqueFileName}`;
            return res.status(200).json({
                success: true,
                message: 'Portada cargada exitosamente.',
                url: relativeUrl
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = AdminController;

