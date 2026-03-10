const Usuario = require('../models/usuarioModel');

const authController = {

    login: async (req, res) => {
        try {

            const { usuario, contraseña } = req.body;

            if (!usuario || !contraseña) {
                return res.status(400).json({
                    success: false,
                    message: "Usuario y contraseña requeridos"
                });
            }

            const user = await Usuario.findByUsername(usuario);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario o contraseña incorrectos"
                });
            }

            const validPassword = await Usuario.comparePassword(
                contraseña,
                user.contraseña
            );

            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario o contraseña incorrectos"
                });
            }

             req.session.user = {
                    id: user.id_usuario,
                    nombre: user.nombre,
                    rol: user.rol,
                    sede: user.id_sede
                };

            return res.json({
                success: true,
                user: {
                    id: user.id_usuario,
                    nombre: user.nombre,
                    rol: user.rol,
                    sede: user.id_sede
                }
            });

        } catch (error) {

            console.error("Error login:", error);

            return res.status(500).json({
                success: false,
                message: "Error en servidor"
            });

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