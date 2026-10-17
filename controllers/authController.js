const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const AuthController = {
    async register(req, res, next) {
        try {
            const { username, email, password } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son obligatorios: username, email y password.'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe contener al menos 6 caracteres.'
                });
            }

            const existingEmail = await UserModel.findByEmail(email);
            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: 'El correo electrónico ya se encuentra registrado.'
                });
            }

            const existingUser = await UserModel.findByUsername(username);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'El nombre de usuario ya está en uso.'
                });
            }

            // Hashing with bcrypt (10 rounds) - RNF-01
            const passwordHash = await bcrypt.hash(password, 10);
            const userId = await UserModel.create({ username, email, passwordHash });

            const token = jwt.sign(
                { id: userId, username, email, role: 'user' },
                process.env.JWT_SECRET || 'gamevault_super_secret_jwt_key_2026_tudai',
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente en GameVault.',
                token,
                user: { id: userId, username, email, avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150', bio: 'Gamer en busca de completar su backlog.', platform: 'PC' }
            });
        } catch (err) {
            next(err);
        }
    },

    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe ingresar email y contraseña.'
                });
            }

            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas. Verifique su email o regístrese.'
                });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas. Contraseña incorrecta.'
                });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'gamevault_super_secret_jwt_key_2026_tudai',
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            res.status(200).json({
                success: true,
                message: 'Inicio de sesión exitoso.',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    bio: user.bio,
                    platform: user.platform
                }
            });
        } catch (err) {
            next(err);
        }
    },

    async getProfile(req, res, next) {
        try {
            const user = await UserModel.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
            }

            const favorites = await UserModel.getFavorites(req.user.id);

            res.status(200).json({
                success: true,
                user,
                favorites
            });
        } catch (err) {
            next(err);
        }
    },

    async updateProfile(req, res, next) {
        try {
            const { bio, platform, avatar, favoriteGameIds } = req.body;

            const updatedUser = await UserModel.updateProfile(req.user.id, { bio, platform, avatar });

            if (Array.isArray(favoriteGameIds)) {
                await UserModel.setFavorites(req.user.id, favoriteGameIds);
            }

            const favorites = await UserModel.getFavorites(req.user.id);

            res.status(200).json({
                success: true,
                message: 'Perfil actualizado exitosamente.',
                user: updatedUser,
                favorites
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = AuthController;

