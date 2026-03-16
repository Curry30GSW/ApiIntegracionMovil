const Usuario = require('../models/usuarioModel');
const bcrypt = require('bcrypt');

const usuarioController = {
    // Obtener todos los usuarios (solo admin)
    getAll: async (req, res) => {
        try {
            const usuarios = await Usuario.getAll();
            res.json({
                success: true,
                data: usuarios
            });
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los usuarios'
            });
        }
    },

    // Obtener usuario por ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const usuario = await Usuario.getById(id);

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.json({
                success: true,
                data: usuario
            });
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el usuario'
            });
        }
    },

    // Crear nuevo usuario
    create: async (req, res) => {
        try {
            const { usuario, contraseña, nombre, rol, id_sede } = req.body;

            // Validaciones básicas
            if (!usuario || !contraseña || !nombre || !rol || !id_sede) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son requeridos'
                });
            }

            // Verificar si el usuario ya existe
            const existeUsuario = await Usuario.findByUsername(usuario);
            if (existeUsuario) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario ya está registrado'
                });
            }

            // Encriptar contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contraseña, salt);

            const nuevoUsuario = {
                usuario,
                contraseña: hashedPassword,
                nombre,
                rol,
                id_sede
            };

            const id = await Usuario.create(nuevoUsuario);

            res.status(201).json({
                success: true,
                message: 'Usuario creado exitosamente',
                data: { id }
            });
        } catch (error) {
            console.error('Error al crear usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear el usuario'
            });
        }
    },

    // Actualizar usuario
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { usuario, nombre, rol, id_sede, contraseña } = req.body;

            // Verificar si el usuario existe
            const usuarioExistente = await Usuario.getById(id);
            if (!usuarioExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Verificar si el nombre de usuario ya está en uso por otro usuario
            if (usuario !== usuarioExistente.usuario) {
                const existeUsuario = await Usuario.findByUsername(usuario);
                if (existeUsuario && existeUsuario.id_usuario !== parseInt(id)) {
                    return res.status(400).json({
                        success: false,
                        message: 'El nombre de usuario ya está registrado'
                    });
                }
            }

            const usuarioActualizado = {
                usuario,
                nombre,
                rol,
                id_sede
            };

            // Si se proporciona una nueva contraseña, encriptarla
            if (contraseña && contraseña.trim() !== '') {
                const salt = await bcrypt.genSalt(10);
                usuarioActualizado.contraseña = await bcrypt.hash(contraseña, salt);
            }

            const actualizado = await Usuario.update(id, usuarioActualizado);

            if (actualizado) {
                res.json({
                    success: true,
                    message: 'Usuario actualizado exitosamente'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'No se pudo actualizar el usuario'
                });
            }
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el usuario'
            });
        }
    },

    // Eliminar (desactivar) usuario
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            // Verificar si el usuario existe
            const usuario = await Usuario.getById(id);
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // No permitir eliminarse a sí mismo
            if (usuario.id_usuario === req.session.user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'No puedes inhabilitar tu propio usuario'
                });
            }

            const eliminado = await Usuario.delete(id);

            if (eliminado) {
                res.json({
                    success: true,
                    message: 'Usuario inhabilitado exitosamente'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'No se pudo inhabilitar el usuario'
                });
            }
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar el usuario'
            });
        }
    },

    // Reactivar usuario
    activate: async (req, res) => {
        try {
            const { id } = req.params;

            const activado = await Usuario.activate(id);

            if (activado) {
                res.json({
                    success: true,
                    message: 'Usuario activado exitosamente'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
        } catch (error) {
            console.error('Error al activar usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al activar el usuario'
            });
        }
    }
};

module.exports = usuarioController;