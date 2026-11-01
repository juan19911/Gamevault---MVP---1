const jwt = require('jsonwebtoken');

module.exports = async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Acceso no autorizado: Token no suministrado en la cabecera.'
            });
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                success: false,
                message: 'Formato de token inválido. Se espera: Bearer <token>'
            });
        }

        const token = parts[1];
        const secret = process.env.JWT_SECRET || 'gamevault_super_secret_jwt_key_2026_tudai';

        const decoded = jwt.verify(token, secret);
        req.user = decoded; // { id, username, email, role, status }

        // Verificar en tiempo real el estado del usuario en base de datos
        try {
            const { db } = require('../config/database');
            const [userRows] = await db.query('SELECT status, role FROM users WHERE id = ?', [decoded.id]);
            if (!userRows || userRows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario inexistente o cuenta eliminada. Sesión revocada.'
                });
            }
            req.user.status = userRows[0].status || 'active';
            req.user.role = userRows[0].role || 'user';
            
            // Suspensión disciplinaria: bloquea todas las operaciones mutativas (POST, PUT, DELETE)
            if (req.user.status === 'banned') {
                if (req.method !== 'GET') {
                    return res.status(403).json({
                        success: false,
                        banned: true,
                        message: 'Tu cuenta ha sido suspendida / baneada por un administrador de GameVault. No tienes permiso para realizar acciones en la plataforma.'
                    });
                }
            }
        } catch (dbErr) {
            return res.status(500).json({
                success: false,
                message: 'Error al verificar el estado de la cuenta de usuario.'
            });
        }

        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Token expirado o no válido. Por favor inicie sesión nuevamente.'
        });
    }
};
