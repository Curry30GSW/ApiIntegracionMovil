const Usuario = require('../models/usuarioModel');
const jwt = require('jsonwebtoken');

const authController = {


    login: async (req, res) => {
        try {
            const { usuario, contraseña } = req.body;

            // 1. Validar que llegaron los datos
            if (!usuario || !contraseña) {
                return res.status(400).json({
                    success: false,
                    message: "Usuario y contraseña requeridos"
                });
            }

            // 2. Buscar al usuario en la BD
            const user = await Usuario.findByUsername(usuario);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario o contraseña incorrectos"
                });
            }

            // 3. Verificar la contraseña
            const validPassword = await Usuario.comparePassword(contraseña, user.contraseña);
            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario o contraseña incorrectos"
                });
            }

            // 4. 📌 CREAR EL TOKEN JWT
            // El payload son los datos del usuario que necesitaremos en el frontend
            const token = jwt.sign(
                {
                    id: user.id_usuario,
                    nombre: user.nombre,
                    rol: user.rol,
                    sede: user.id_sede,
                    nombre_sede: user.nombre_sede
                },
                process.env.JWT_SECRET || "secreto_super_seguro_para_firmar", // Usa una variable de entorno
                { expiresIn: '24h' } // El token expira en 24 horas
            );

            // 5. Devolver el token al frontend (YA NO USAMOS req.session)
            return res.json({
                success: true,
                token: token, // <--- El frontend guardará este token
                user: {
                    id: user.id_usuario,
                    nombre: user.nombre,
                    rol: user.rol,
                    sede: user.id_sede,
                    nombre_sede: user.nombre_sede
                }
            });

        } catch (error) {
            console.error("Error en login:", error);
            return res.status(500).json({
                success: false,
                message: "Error en el servidor"
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