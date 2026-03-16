const Usuario = require('../models/usuarioModel');

const authController = {

    login: async (req, res) => {
        try {
            const { usuario, contraseña } = req.body;

            // Validaciones...
            const user = await Usuario.findByUsername(usuario);
            const validPassword = await Usuario.comparePassword(contraseña, user.contraseña);

            if (!user || !validPassword) {
                return res.status(401).json({ success: false, message: "Credenciales incorrectas" });
            }

            // Crear token JWT (NO sesión)
            const token = jwt.sign(
                {
                    id: user.id_usuario,
                    nombre: user.nombre,
                    rol: user.rol,
                    sede: user.id_sede,
                    nombre_sede: user.nombre_sede
                },
                process.env.JWT_SECRET || 'secreto_super_seguro',
                { expiresIn: '24h' }
            );

            // Enviar token al frontend
            req.session.save((err) => {
                if (err) {
                    console.error('Error al guardar sesión:', err);
                    return res.status(500).json({ success: false });
                }

                return res.json({
                    success: true,
                    user: {
                        id: user.id_usuario,
                        nombre: user.nombre,
                        rol: user.rol,
                        sede: user.id_sede,
                        nombre_sede: user.nombre_sede
                    }
                });
            });
        } catch (error) {
            console.error("Error login:", error);
            return res.status(500).json({ success: false, message: "Error en servidor" });
        }
    },

    dashboard: async (req, res) => {

        const user = await Usuario.getById(req.session.userId);

        res.json({
            success: true,
            user
        });

    },

    logout: (req, res) => {

        req.session.destroy(() => {

            res.json({
                success: true
            });

        });

    }
};

module.exports = authController;