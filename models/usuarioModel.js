const db = require('../config/mysql');
const bcrypt = require('bcrypt');

class Usuario {
    // Buscar usuario por nombre de usuario
    static async findByUsername(usuario) {
        try {
            const [rows] = await db.query(
                `SELECT 
                    id_usuario,
                    usuario,
                    contraseña,
                    nombre,
                    rol,
                    id_sede
                FROM usuarios 
                WHERE usuario = ? AND activo = 1`,
                [usuario]
            );

            return rows[0];

        } catch (error) {
            throw error;
        }
    }

    static async comparePassword(contraseñaIngresada, contraseñaAlmacenada) {
        return await bcrypt.compare(contraseñaIngresada, contraseñaAlmacenada);
    }

    static async getById(id) {
        try {
            const [rows] = await db.query(
                `SELECT id_usuario, usuario, nombre, rol, id_sede
                 FROM usuarios 
                 WHERE id_usuario = ?`,
                [id]
            );

            return rows[0];

        } catch (error) {
            throw error;
        }
    }

    // Crear nuevo usuario (para registro)
    static async create(usuarioData) {
        try {
            const { usuario, contraseña, nombre, rol } = usuarioData;

            // Encriptar contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contraseña, salt);

            const [result] = await db.query(
                'INSERT INTO usuarios (usuario, contraseña, nombre, rol, activo) VALUES (?, ?, ?, ?, ?)',
                [usuario, hashedPassword, nombre, rol, true]
            );

            return result.insertId;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Usuario;