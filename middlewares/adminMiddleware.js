module.exports = function adminMiddleware(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Acceso no autorizado: Debe iniciar sesión.'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado: Se requieren privilegios de administrador.'
        });
    }

    next();
};
