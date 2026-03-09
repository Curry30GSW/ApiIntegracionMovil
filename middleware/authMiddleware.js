const authMiddleware = {
    // Verificar si el usuario está autenticado
    isAuthenticated: (req, res, next) => {
        if (req.session.userId) {
            return next();
        }
        res.redirect('/login');
    },

    // Verificar si es admin (ejemplo de rol)
    isAdmin: (req, res, next) => {
        if (req.session.userRole === 'admin') {
            return next();
        }
        res.status(403).render('error', {
            message: 'Acceso denegado. Se requieren permisos de administrador.'
        });
    },

    // Redirigir si ya está logueado
    isLoggedIn: (req, res, next) => {
        if (req.session.userId) {
            return res.redirect('/dashboard');
        }
        next();
    }
};

module.exports = authMiddleware;