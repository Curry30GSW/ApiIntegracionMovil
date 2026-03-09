const Usuario = require('../models/usuarioModel');

const authController = {
    // Mostrar formulario de login
    showLoginForm: (req, res) => {
        res.render('login', { error: null });
    },

    // Procesar login
    login: async (req, res) => {
        try {
            const { usuario, contraseña } = req.body;

            // Validar que no estén vacíos
            if (!usuario || !contraseña) {
                return res.render('login', {
                    error: 'Usuario y contraseña son requeridos'
                });
            }

            // Buscar usuario en la base de datos
            const user = await Usuario.findByUsername(usuario);

            if (!user) {
                return res.render('login', {
                    error: 'Usuario o contraseña incorrectos'
                });
            }

            // Verificar contraseña
            const validPassword = await Usuario.comparePassword(contraseña, user.contraseña);

            if (!validPassword) {
                return res.render('login', {
                    error: 'Usuario o contraseña incorrectos'
                });
            }

            // Crear sesión
            req.session.userId = user.id_usuario;
            req.session.userName = user.nombre;
            req.session.userRole = user.rol;

            res.redirect('/dashboard');

        } catch (error) {
            console.error('Error en login:', error);
            res.render('login', {
                error: 'Error en el servidor'
            });
        }
    },

    // Dashboard
    dashboard: async (req, res) => {
        try {
            const user = await Usuario.getById(req.session.userId);
            res.render('dashboard', { user });
        } catch (error) {
            console.error('Error en dashboard:', error);
            res.redirect('/login');
        }
    },

    // Logout
    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error al cerrar sesión:', err);
            }
            res.redirect('/login');
        });
    }
};

module.exports = authController;