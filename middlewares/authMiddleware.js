const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
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
        req.user = decoded; // { id, username, email, role }
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Token expirado o no válido. Por favor inicie sesión nuevamente.'
        });
    }
};

