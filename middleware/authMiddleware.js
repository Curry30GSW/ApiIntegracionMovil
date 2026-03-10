const authMiddleware = {

    // Verificar si el usuario está autenticado
    isAuthenticated: (req, res, next) => {

        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "No autenticado"
            });
        }

        next();
    },

    // Verificar si es admin
    isAdmin: (req, res, next) => {

        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "No autenticado"
            });
        }

        if (req.session.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Acceso denegado"
            });
        }

        next();
    },

    // Obtener sede del usuario
    getSede: (req, res, next) => {

        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "No autenticado"
            });
        }

        req.id_sede = req.session.user.sede;

        next();
    },

};

module.exports = authMiddleware;