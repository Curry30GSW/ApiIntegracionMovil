const jwt = require('jsonwebtoken');

const authJWT = {
    // Verificar el token en las peticiones
    verificarToken: (req, res, next) => {
        // 1. Obtener el token del header 'Authorization'
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Acceso denegado. Token no proporcionado."
            });
        }

        try {
            // 2. Verificar que el token sea válido y no haya expirado
            const verified = jwt.verify(token, process.env.JWT_SECRET || "secreto_super_seguro_para_firmar");

            // 3. Adjuntar los datos del usuario a la petición para usarlos después
            req.user = verified;
            req.id_sede = verified.sede; // Esto es para tu método getSede
            next();

        } catch (error) {
            // Si el token es inválido o expiró
            return res.status(401).json({
                success: false,
                message: "Token inválido o expirado. Inicia sesión nuevamente."
            });
        }
    },

    // Verificar si es admin
    esAdmin: (req, res, next) => {
        if (req.user.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Acceso denegado. Se requieren permisos de administrador."
            });
        }
        next();
    },

    // Obtener sede (ya lo hacemos en verificarToken, pero lo dejamos por si lo necesitas)
    getSede: (req, res, next) => {
        req.id_sede = req.user.sede;
        next();
    }
};

module.exports = authJWT;